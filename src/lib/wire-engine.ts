/**
 * T1 Terminal — Real-Time Intelligence Wire Engine
 *
 * Combines REAL data (RSS + GDELT via /api/feed) with simulated delivery timing.
 * - Polls /api/feed every 60s for fresh headlines
 * - Delivers items at realistic wire-service cadence (1-5s intervals)
 * - Falls back to mock headlines if API fails
 * - Web Audio API alert beep for FLASH items
 * - Live throughput metrics (items/min, latency)
 */

export type IntelCategory = 'MARKETS' | 'POLITICS' | 'ECONOMICS' | 'GEOPOLITICS' | 'TECH' | 'ENERGY' | 'DEFENSE' | 'CYBER' | 'GOVERNANCE' | 'IR' | 'AGRICULTURE' | 'ENVIRONMENT' | 'DISASTER' | 'INTERNAL_SECURITY' | 'SCIENCE';
export type IntelUrgency = 'FLASH' | 'URGENT' | 'BULLETIN' | 'NORMAL';
export type IntelSource = 'T1 WIRE' | 'SIGINT' | 'GOVINT' | 'FININT' | 'OSINT';

export interface IntelItem {
  id: string;
  timestamp: number;
  headline: string;
  source: IntelSource;
  category: IntelCategory;
  urgency: IntelUrgency;
  region?: string;
  ticker?: string;
  link?: string;
  imageUrl?: string;
  engagementScore?: number;
  storyline?: string;
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  isReal?: boolean; // true = from API, false = mock fallback
}

// Basic heuristic logic for sentiment analysis
function computeSentiment(headline: string, category: IntelCategory): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
  const h = headline.toLowerCase();
  const bullishKeywords = ['surge', 'record', 'high', 'jump', 'gain', 'growth', 'expectations', 'buyback', 'stable', 'bull', 'upgrade'];
  const bearishKeywords = ['contract', 'weakness', 'tension', 'drop', 'fall', 'escalate', 'cut', 'crash', 'loss', 'bear', 'downgrade', 'sanction'];
  
  let score = 0;
  for (const word of bullishKeywords) { if (h.includes(word)) score++; }
  for (const word of bearishKeywords) { if (h.includes(word)) score--; }
  
  if (score > 0) return 'BULLISH';
  if (score < 0) return 'BEARISH';
  return 'NEUTRAL';
}

// Category-based thumbnail seeds for deterministic images
const CATEGORY_IMAGE_SEEDS: Partial<Record<IntelCategory, number[]>> = {
  MARKETS:     [1060, 534, 443, 669, 730],
  POLITICS:    [901, 457, 48, 1068, 906],
  ECONOMICS:   [534, 669, 1060, 730, 443],
  GEOPOLITICS: [60, 1011, 306, 76, 826],
  TECH:        [1, 180, 366, 574, 823],
  ENERGY:      [414, 803, 1031, 433, 992],
  DEFENSE:     [76, 826, 306, 60, 1011],
  CYBER:       [823, 574, 1, 366, 180],
};
let imageCounter = 0;
function getCategoryImage(category: IntelCategory): string {
  const seeds = CATEGORY_IMAGE_SEEDS[category] || [1060, 534, 443];
  const seed = seeds[imageCounter++ % seeds.length];
  return `https://picsum.photos/seed/${seed}/160/120`;
}

// ===== MOCK FALLBACK HEADLINES (used when API is down) =====
const MOCK_HEADLINES: Omit<IntelItem, 'id' | 'timestamp'>[] = [
  { headline: 'Federal Reserve signals potential rate hold through Q2 amid sticky inflation data', source: 'T1 WIRE', category: 'ECONOMICS', urgency: 'URGENT' },
  { headline: 'NVIDIA surpasses revenue expectations, AI chip demand continues to surge', source: 'T1 WIRE', category: 'TECH', urgency: 'FLASH', ticker: 'NVDA' },
  { headline: 'G7 leaders agree on expanded sanctions package targeting energy exports', source: 'GOVINT', category: 'GEOPOLITICS', urgency: 'FLASH' },
  { headline: 'US Treasury yields rise to 4.35% as investors reassess rate cut expectations', source: 'FININT', category: 'MARKETS', urgency: 'URGENT' },
  { headline: 'China manufacturing PMI contracts for third consecutive month', source: 'FININT', category: 'ECONOMICS', urgency: 'URGENT', region: 'APAC' },
  { headline: 'Gold prices hit new record high amid geopolitical tensions and dollar weakness', source: 'T1 WIRE', category: 'MARKETS', urgency: 'FLASH', ticker: 'XAU' },
  { headline: 'OPEC+ extends production cuts through end of year, oil prices stable', source: 'T1 WIRE', category: 'ENERGY', urgency: 'BULLETIN' },
  { headline: 'EU proposes new digital markets regulation targeting US tech giants', source: 'GOVINT', category: 'POLITICS', urgency: 'NORMAL' },
  { headline: 'Middle East tensions escalate: crude oil spikes 3% on shipping lane concerns', source: 'SIGINT', category: 'GEOPOLITICS', urgency: 'FLASH' },
  { headline: 'Apple announces largest-ever share buyback program worth $110 billion', source: 'T1 WIRE', category: 'MARKETS', urgency: 'BULLETIN', ticker: 'AAPL' },
];

// ===== ENGINE STATE =====
let itemCounter = 0;
let engineRunning = false;
let deliveryTimeout: ReturnType<typeof setTimeout> | null = null;
let pollInterval: ReturnType<typeof setInterval> | null = null;
let metricsInterval: ReturnType<typeof setInterval> | null = null;

// Queue of items waiting to be delivered
let deliveryQueue: Omit<IntelItem, 'id'>[] = [];
let mockIndex = 0;

// === DEDUPLICATION: tracks every headline ever delivered across ALL polls ===
// Keyed by first 60 chars of lowercased headline. Capped at 500.
const deliveredHeadlines = new Set<string>();
function headlineKey(h: string) { return h.toLowerCase().slice(0, 60); }

// Metrics
let itemsLastMinute: number[] = [];
let totalItems = 0;
let apiStatus: 'connected' | 'fallback' = 'fallback';
let lastFetchLatency = 0;

// Audio
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playFlashAlert() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'square';
    gain.gain.value = 0.05;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* Audio may not be available */ }
}

// ===== CALLBACKS =====
type OnNewItem = (item: IntelItem) => void;
type OnMetrics = (ipm: number, total: number, latencyMs: number, status: string) => void;

let onNewItemCallback: OnNewItem | null = null;
let onMetricsCallback: OnMetrics | null = null;

// ===== FETCH REAL DATA =====
async function fetchRealData() {
  try {
    const start = performance.now();
    const res = await fetch('/api/feed');
    lastFetchLatency = Math.round(performance.now() - start);

    if (!res.ok) throw new Error('API error');

    const data = await res.json();
    const items: Array<{ headline: string; source: string; category: string; urgency: string; timestamp: number; link?: string; region?: string; ticker?: string; engagementScore?: number; storyline?: string }> = data.items || [];

    if (items.length === 0) throw new Error('Empty response');

    apiStatus = 'connected';

    // Filter out items already in the queue OR already delivered
    const queuedKeys = new Set(deliveryQueue.map(i => headlineKey(i.headline)));
    const newItems = items.filter(i => {
      const key = headlineKey(i.headline);
      return !queuedKeys.has(key) && !deliveredHeadlines.has(key);
    });

    // Add to delivery queue with proper typing + isReal flag
    for (const item of newItems) {
      deliveryQueue.push({
        headline: item.headline,
        source: (item.source || 'OSINT') as IntelSource,
        category: (item.category || 'GEOPOLITICS') as IntelCategory,
        urgency: (item.urgency || 'NORMAL') as IntelUrgency,
        timestamp: item.timestamp || Date.now(),
        link: item.link,
        region: item.region,
        ticker: item.ticker,
        engagementScore: item.engagementScore,
        storyline: item.storyline,
        sentiment: computeSentiment(item.headline, (item.category || 'GEOPOLITICS') as IntelCategory),
        isReal: true,
      });
    }

    // Sort queue by engagement score (highest first), then urgency, then recency
    const urgencyOrder: Record<string, number> = { FLASH: 0, URGENT: 1, BULLETIN: 2, NORMAL: 3 };
    deliveryQueue.sort((a, b) => {
      // Engagement score first (highest wins)
      const aScore = a.engagementScore ?? 0;
      const bScore = b.engagementScore ?? 0;
      if (aScore !== bScore) return bScore - aScore;
      // Then urgency
      const aOrder = urgencyOrder[a.urgency] ?? 3;
      const bOrder = urgencyOrder[b.urgency] ?? 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.timestamp - a.timestamp;
    });

  } catch {
    apiStatus = 'fallback';
    lastFetchLatency = 0;
    // Inject a mock item into the queue so delivery continues
    if (deliveryQueue.length < 5) {
      const mock = MOCK_HEADLINES[mockIndex % MOCK_HEADLINES.length];
      mockIndex++;
      deliveryQueue.push({ ...mock, timestamp: Date.now(), sentiment: computeSentiment(mock.headline, mock.category as IntelCategory), isReal: false });
    }
  }
}

// ===== DELIVERY LOOP =====
function deliverNext() {
  if (!engineRunning) return;

  let item: Omit<IntelItem, 'id'>;

  if (deliveryQueue.length > 0) {
    item = deliveryQueue.shift()!;
  } else {
    // Fallback to mock
    const mock = MOCK_HEADLINES[mockIndex % MOCK_HEADLINES.length];
    mockIndex++;
    item = { ...mock, timestamp: Date.now(), sentiment: computeSentiment(mock.headline, mock.category as IntelCategory), isReal: false };
  }

  itemCounter++;
  totalItems++;
  itemsLastMinute.push(Date.now());

  const fullItem: IntelItem = {
    ...item,
    id: `intel-${Date.now()}-${itemCounter}`,
    timestamp: Date.now(),
    imageUrl: item.imageUrl || getCategoryImage(item.category as IntelCategory),
  };

  // Mark headline as delivered so it's never shown again this session
  deliveredHeadlines.add(headlineKey(item.headline));
  // Cap delivered set size to prevent unbounded memory growth
  if (deliveredHeadlines.size > 500) {
    const first = deliveredHeadlines.values().next().value;
    if (first) deliveredHeadlines.delete(first);
  }

  if (onNewItemCallback) onNewItemCallback(fullItem);

  // Schedule next delivery with variable timing
  const delay = getDeliveryDelay();
  deliveryTimeout = setTimeout(deliverNext, delay);
}

function getDeliveryDelay(): number {
  // If queue is large, deliver faster to catch up
  if (deliveryQueue.length > 20) return 500 + Math.random() * 500;
  if (deliveryQueue.length > 10) return 800 + Math.random() * 1200;
  // Normal cadence
  const rand = Math.random();
  if (rand < 0.1) return 800 + Math.random() * 700;    // Fast burst
  if (rand < 0.4) return 1500 + Math.random() * 2000;  // Medium
  return 2500 + Math.random() * 3500;                   // Normal wire pace
}

function updateMetrics() {
  const now = Date.now();
  itemsLastMinute = itemsLastMinute.filter(t => now - t < 60_000);
  const ipm = itemsLastMinute.length;
  if (onMetricsCallback) {
    onMetricsCallback(ipm, totalItems, lastFetchLatency, apiStatus);
  }
}

// ===== PUBLIC API =====
export function startWireEngine(onItem: OnNewItem, onMetrics: OnMetrics) {
  if (engineRunning) return;
  engineRunning = true;
  onNewItemCallback = onItem;
  onMetricsCallback = onMetrics;
  deliveryQueue = [];
  itemsLastMinute = [];
  totalItems = 0;
  mockIndex = 0;

  // Initial fetch
  fetchRealData().then(() => {
    // Start delivering items with staggered initial burst
    const burstCount = Math.min(8, deliveryQueue.length);
    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        if (!engineRunning) return;
        if (deliveryQueue.length > 0) {
          const item = deliveryQueue.shift()!;
          itemCounter++;
          totalItems++;
          itemsLastMinute.push(Date.now());
          const fullItem: IntelItem = {
            ...item,
            id: `intel-${Date.now()}-${itemCounter}`,
            timestamp: Date.now(),
            imageUrl: item.imageUrl || getCategoryImage(item.category as IntelCategory),
          };
          // Track delivered
          deliveredHeadlines.add(headlineKey(item.headline));
          if (onNewItemCallback) onNewItemCallback(fullItem);
        }
      }, i * 80);
    }

    // Start continuous delivery after initial burst
    setTimeout(() => {
      if (engineRunning) deliverNext();
    }, burstCount * 80 + 500);
  });

  // Poll API every 60s for fresh data
  pollInterval = setInterval(() => {
    fetchRealData();
  }, 60_000);

  // Metrics update every second
  metricsInterval = setInterval(updateMetrics, 1000);
}

export function stopWireEngine() {
  engineRunning = false;
  onNewItemCallback = null;
  onMetricsCallback = null;
  if (deliveryTimeout) clearTimeout(deliveryTimeout);
  if (pollInterval) clearInterval(pollInterval);
  if (metricsInterval) clearInterval(metricsInterval);
  deliveryTimeout = null;
  pollInterval = null;
  metricsInterval = null;
  deliveryQueue = [];
  itemsLastMinute = [];
  totalItems = 0;
  deliveredHeadlines.clear();
}

// ===== RELATIVE TIME (ultra-fast) =====
export function fastRelativeTime(timestampMs: number): string {
  const diff = ((Date.now() - timestampMs) / 1000) | 0;
  if (diff < 3) return 'NOW';
  if (diff < 60) return diff + 's';
  if (diff < 3600) return ((diff / 60) | 0) + 'm';
  if (diff < 86400) return ((diff / 3600) | 0) + 'h';
  return ((diff / 86400) | 0) + 'd';
}
