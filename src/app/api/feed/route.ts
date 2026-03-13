/**
 * T1 Terminal — Live Feed API Route
 * 
 * Curated sources:
 * - 7 Google News RSS feeds (India-focused: Economy, Governance, IR, Defence, Environment, Agriculture, Science)
 * - Finnhub financial news API
 * - GDELT geopolitical event database
 * 
 * Only last 24h news. Ranked by engagement score. Cached 45s.
 */

import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// ===== TYPES =====
interface FeedItem {
  headline: string;
  source: string;
  category: string;
  urgency: string;
  timestamp: number;
  link?: string;
  region?: string;
  ticker?: string;
  storyline?: string;
  engagementScore?: number;
}

// ===== FINNHUB =====
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';

// ===== CURATED RSS FEEDS (user-defined) =====
const RSS_FEEDS: Array<{ url: string; source: string; defaultCategory: string; region?: string }> = [
  // Economy (RBI, GDP, fiscal)
  { url: 'https://news.google.com/rss/search?q=india+economy+RBI+GDP&hl=en-IN&gl=IN&ceid=IN:en', source: 'GOOGLE NEWS', defaultCategory: 'ECONOMICS', region: 'INDIA' },
  // Governance (parliament, policy, ministry)
  { url: 'https://news.google.com/rss/search?q=india+parliament+policy+ministry&hl=en-IN&gl=IN&ceid=IN:en', source: 'GOOGLE NEWS', defaultCategory: 'GOVERNANCE', region: 'INDIA' },
  // International Relations (foreign policy, diplomacy)
  { url: 'https://news.google.com/rss/search?q=india+foreign+policy+diplomacy&hl=en-IN&gl=IN&ceid=IN:en', source: 'GOOGLE NEWS', defaultCategory: 'IR', region: 'INDIA' },
  // Defence & Security
  { url: 'https://news.google.com/rss/search?q=india+defence+security+army&hl=en-IN&gl=IN&ceid=IN:en', source: 'GOOGLE NEWS', defaultCategory: 'DEFENSE', region: 'INDIA' },
  // Environment & Climate & Disaster
  { url: 'https://news.google.com/rss/search?q=india+environment+climate+disaster&hl=en-IN&gl=IN&ceid=IN:en', source: 'GOOGLE NEWS', defaultCategory: 'ENVIRONMENT', region: 'INDIA' },
  // Agriculture & Farmers
  { url: 'https://news.google.com/rss/search?q=india+agriculture+farmer+MSP&hl=en-IN&gl=IN&ceid=IN:en', source: 'GOOGLE NEWS', defaultCategory: 'AGRICULTURE', region: 'INDIA' },
  // Science & Tech (ISRO etc.)
  { url: 'https://news.google.com/rss/search?q=india+ISRO+science+technology&hl=en-IN&gl=IN&ceid=IN:en', source: 'GOOGLE NEWS', defaultCategory: 'SCIENCE', region: 'INDIA' },
];

// ===== 24-HOUR CUTOFF =====
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

// ===== SOURCE AUTHORITY WEIGHTS =====
const SOURCE_AUTHORITY: Record<string, number> = {
  'GOOGLE NEWS': 7, 'FINNHUB': 7, 'GDELT': 5,
  'OSINT': 7, 'FININT': 7, 'SIGINT': 5, 'GOVINT': 9,
};

// ===== KEYWORD CATEGORIZATION =====
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  GOVERNANCE: [
    'governance', 'policy', 'regulation', 'niti aayog', 'cabinet', 'ordinance',
    'public sector', 'privatization', 'digital india', 'make in india', 'swachh bharat',
    'aadhaar', 'upi', 'panchayat', 'municipal', 'smart city', 'ayushman',
    'pradhan mantri', 'ministry', 'parliament', 'lok sabha', 'rajya sabha',
    'bill passed', 'amendment', 'act ', 'scheme', 'quota', 'reservation',
  ],
  IR: [
    'foreign policy', 'bilateral', 'multilateral', 'summit', 'treaty', 'diplomatic',
    'ambassador', 'g20', 'g7', 'brics', 'sco', 'quad', 'asean', 'saarc',
    'indo-pacific', 'maldives', 'sri lanka', 'nepal', 'bangladesh',
    'un general assembly', 'extradition', 'visa', 'trade agreement', 'fta',
  ],
  AGRICULTURE: [
    'agriculture', 'farmer', 'crop', 'harvest', 'msp', 'minimum support price',
    'monsoon', 'drought', 'irrigation', 'fertilizer', 'food security',
    'dairy', 'fisheries', 'kisan', 'farm law', 'procurement',
    'sugar', 'wheat', 'rice', 'cotton', 'soybean', 'palm oil',
  ],
  ENVIRONMENT: [
    'climate change', 'global warming', 'carbon emission', 'deforestation',
    'biodiversity', 'pollution', 'air quality', 'aqi', 'cop28', 'cop29',
    'paris agreement', 'net zero', 'green hydrogen', 'ev ', 'electric vehicle',
    'renewable energy', 'solar', 'wind farm', 'plastic ban', 'water crisis',
    'glacier', 'wildlife', 'forest', 'ocean',
  ],
  DISASTER: [
    'earthquake', 'tsunami', 'cyclone', 'hurricane', 'typhoon', 'flood',
    'landslide', 'wildfire', 'volcanic', 'tornado', 'famine',
    'disaster relief', 'ndrf', 'sdrf', 'evacuation', 'rescue',
    'heatwave', 'cold wave', 'storm surge', 'cloudburst',
  ],
  INTERNAL_SECURITY: [
    'terrorism', 'naxal', 'maoist', 'insurgency', 'border security', 'bsf',
    'crpf', 'nsg', 'nia', 'encounter', 'ceasefire violation', 'loc ',
    'lac ', 'curfew', 'section 144', 'riot', 'communal',
    'drug trafficking', 'uapa', 'afspa', 'counter terror', 'national security',
  ],
  SCIENCE: [
    'space', 'isro', 'nasa', 'satellite', 'rocket launch', 'mars', 'moon',
    'chandrayaan', 'gaganyaan', 'aditya', 'spacex',
    'quantum computing', 'biotechnology', 'gene editing', 'crispr',
    'vaccine', 'clinical trial', 'pandemic', 'virus',
    'nuclear fusion', 'nobel prize', 'astronomy', 'telescope',
  ],
  POLITICS: [
    'election', 'congress', 'parliament', 'vote', 'ballot', 'legislation',
    'presidency', 'prime minister', 'opposition', 'campaign', 'supreme court',
    'judiciary', 'impeach', 'referendum', 'modi', 'bjp', 'aap', 'rahul gandhi',
  ],
  MARKETS: [
    'stock', 'shares', 'market rally', 'dow', 'nasdaq', 's&p', 'wall street',
    'ipo', 'dividend', 'earnings', 'trading', 'investor', 'sensex', 'nifty',
    'bse', 'nse', 'sebi', 'fii', 'dii', 'mutual fund', 'etf',
  ],
  ECONOMICS: [
    'inflation', 'gdp', 'interest rate', 'central bank', 'recession', 'employment',
    'fiscal', 'monetary', 'treasury', 'imf', 'world bank', 'debt',
    'budget', 'tariff', 'trade deficit', 'rbi', 'repo rate', 'cpi', 'gst',
  ],
  GEOPOLITICS: [
    'war', 'troops', 'missile', 'nuclear', 'ceasefire', 'invasion',
    'sanctions', 'nato', 'un security council', 'refugee', 'conflict', 'airstrike',
  ],
  TECH: [
    'ai', 'artificial intelligence', 'software', 'chip', 'semiconductor',
    'google', 'apple', 'microsoft', 'meta', 'nvidia', 'startup',
    'cloud', 'machine learning', 'infosys', 'tcs', 'wipro', 'blockchain',
  ],
  ENERGY: [
    'oil', 'gas', 'opec', 'pipeline', 'crude', 'fuel', 'coal',
    'electricity', 'power grid', 'energy crisis', 'lng',
  ],
  DEFENSE: [
    'pentagon', 'weapons', 'arms deal', 'navy', 'air force', 'army', 'drone strike',
    'defense spending', 'drdo', 'hal', 'tejas', 'rafale', 'brahmos',
    'aircraft carrier', 'nuclear submarine', 'ballistic missile', 'hypersonic',
  ],
  CYBER: [
    'ransomware', 'cyber attack', 'data breach', 'malware',
    'phishing', 'encryption', 'cybersecurity', 'deepfake',
  ],
};

// ===== STORYLINE DETECTION =====
const STORYLINES: Array<{ keywords: string[]; label: string }> = [
  { keywords: ['trump', 'tariff', 'trade war', 'china tariff', 'us-china trade'], label: 'Trump–China Tariffs' },
  { keywords: ['russia', 'ukraine', 'zelensky', 'putin', 'kyiv', 'crimea', 'donbas'], label: 'Russia–Ukraine War' },
  { keywords: ['india', 'maldives', 'muizzu', 'male ', 'lakshadweep'], label: 'India–Maldives Reset' },
  { keywords: ['rbi', 'repo rate', 'rate cut', 'rate hike', 'monetary policy'], label: 'RBI Rate Cycle' },
  { keywords: ['semiconductor', 'chip war', 'tsmc', 'chips act', 'fab ', 'foundry'], label: 'Semiconductor War' },
  { keywords: ['iran', 'israel', 'hezbollah', 'hamas', 'gaza', 'tehran', 'netanyahu'], label: 'Iran–Israel Conflict' },
  { keywords: ['ai regulation', 'openai', 'chatgpt', 'gemini', 'llm', 'ai safety'], label: 'AI Race' },
  { keywords: ['climate summit', 'cop2', 'net zero', 'paris agreement', 'carbon tax'], label: 'Climate Action' },
  { keywords: ['modi', 'bjp', 'india election', 'lok sabha'], label: 'Indian Politics' },
];

function detectStoryline(headline: string): string | undefined {
  const lower = headline.toLowerCase();
  for (const s of STORYLINES) {
    if (s.keywords.some(kw => lower.includes(kw))) return s.label;
  }
  return undefined;
}

// ===== HOT KEYWORDS =====
const HOT_KEYWORDS = [
  'breaking', 'exclusive', 'just in', 'flash', 'alert', 'crash', 'rally',
  'surge', 'plunge', 'record', 'unprecedented', 'historic', 'crisis',
  'war', 'nuclear', 'emergency', 'soar', 'tumble', 'shock', 'boom',
  'rate cut', 'rate hike', 'ban', 'arrest', 'resign', 'scandal',
  'billion', 'trillion', 'collapse', 'earthquake', 'flood', 'cyclone',
  'terror', 'missile', 'sanction',
];

// ===== TICKER PATTERNS (35) =====
const TICKER_PATTERNS: Array<{ pattern: RegExp; ticker: string }> = [
  // Indian Indices
  { pattern: /\bsensex\b/i, ticker: 'SENSEX' },
  { pattern: /\bnifty\b/i, ticker: 'NIFTY' },
  { pattern: /\bbank nifty\b/i, ticker: 'BANKNIFTY' },
  // Indian Companies
  { pattern: /\breliance\b/i, ticker: 'RELIANCE' },
  { pattern: /\btata\b/i, ticker: 'TATA' },
  { pattern: /\badani\b/i, ticker: 'ADANI' },
  { pattern: /\binfosys\b|\binfy\b/i, ticker: 'INFY' },
  { pattern: /\btcs\b/i, ticker: 'TCS' },
  { pattern: /\bhdfc\b/i, ticker: 'HDFC' },
  { pattern: /\bwipro\b/i, ticker: 'WIPRO' },
  { pattern: /\bhcl tech\b/i, ticker: 'HCLTECH' },
  { pattern: /\bsbi\b/i, ticker: 'SBIN' },
  { pattern: /\bicici\b/i, ticker: 'ICICIBANK' },
  { pattern: /\bkotak\b/i, ticker: 'KOTAKBANK' },
  { pattern: /\bbajaj\b/i, ticker: 'BAJFINANCE' },
  { pattern: /\bmaruti\b/i, ticker: 'MARUTI' },
  // US Tech
  { pattern: /\bnvidia\b|\bnvda\b/i, ticker: 'NVDA' },
  { pattern: /\bapple\b|\baapl\b/i, ticker: 'AAPL' },
  { pattern: /\btesla\b|\btsla\b/i, ticker: 'TSLA' },
  { pattern: /\bmicrosoft\b|\bmsft\b/i, ticker: 'MSFT' },
  { pattern: /\bgoogle\b|\balphabet\b|\bgoog\b/i, ticker: 'GOOGL' },
  { pattern: /\bmeta\b|\bfacebook\b/i, ticker: 'META' },
  { pattern: /\bamazon\b|\bamzn\b/i, ticker: 'AMZN' },
  // Commodities & Currencies
  { pattern: /\bgold\b/i, ticker: 'XAU' },
  { pattern: /\bsilver\b/i, ticker: 'XAG' },
  { pattern: /\bcrude oil\b|\bbrent\b|\bwti\b/i, ticker: 'CL' },
  { pattern: /\bnatural gas\b/i, ticker: 'NG' },
  { pattern: /\brupee\b|\binr\b/i, ticker: 'USD/INR' },
  { pattern: /\bdollar index\b|\bdxy\b/i, ticker: 'DXY' },
  // Crypto
  { pattern: /\bbitcoin\b|\bbtc\b/i, ticker: 'BTC' },
  { pattern: /\bethereum\b|\beth\b/i, ticker: 'ETH' },
  // Semiconductor
  { pattern: /\btsmc\b/i, ticker: 'TSM' },
  { pattern: /\bamd\b/i, ticker: 'AMD' },
  { pattern: /\bintel\b/i, ticker: 'INTC' },
];

const URGENCY_KEYWORDS: Record<string, string[]> = {
  FLASH: ['breaking', 'flash', 'just in', 'alert', 'emergency', 'crisis', 'exclusive', 'earthquake', 'tsunami'],
  URGENT: ['urgent', 'developing', 'surge', 'crash', 'plunge', 'soar', 'spike', 'halt', 'collapse', 'record', 'unprecedented', 'cyclone', 'terror'],
  BULLETIN: ['update', 'report', 'announce', 'reveal', 'confirm', 'warns', 'expects', 'launches', 'approves'],
};

function categorize(headline: string, defaultCategory: string): string {
  const lower = headline.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return category;
  }
  return defaultCategory;
}

function assignUrgency(headline: string): string {
  const lower = headline.toLowerCase();
  for (const [urgency, keywords] of Object.entries(URGENCY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return urgency;
  }
  return 'NORMAL';
}

function extractTicker(headline: string): string | undefined {
  for (const { pattern, ticker } of TICKER_PATTERNS) {
    if (pattern.test(headline)) return ticker;
  }
  return undefined;
}

function detectRegion(headline: string, domain?: string): string | undefined {
  const lower = headline.toLowerCase();
  if (/\bindia\b|\bsensex\b|\bnifty\b|\brbi\b|\bmodi\b|\bmumbai\b|\bdelhi\b|\bisro\b|\bbjp\b/.test(lower)) return 'INDIA';
  if (/\bchina\b|\bbeijing\b|\bshanghai\b|\bxi jinping\b/.test(lower)) return 'APAC';
  if (/\bjapan\b|\btokyo\b|\bnikkei\b|\bsouth korea\b/.test(lower)) return 'APAC';
  if (/\beu\b|\beurope\b|\becb\b|\blondon\b|\bgermany\b|\bfrance\b/.test(lower)) return 'EU';
  if (/\bus\b|\bfed\b|\bwall street\b|\bwashington\b|\btrump\b|\bbiden\b/.test(lower)) return 'US';
  if (/\bmiddle east\b|\bisrael\b|\biran\b|\bsaudi\b|\bgaza\b/.test(lower)) return 'MENA';
  if (/\brussia\b|\bputin\b|\bukraine\b|\bkyiv\b/.test(lower)) return 'CIS';
  if (domain?.endsWith('.in')) return 'INDIA';
  return undefined;
}

function mapSource(source: string): string {
  const map: Record<string, string> = {
    'GOOGLE NEWS': 'OSINT', 'FINNHUB': 'FININT', 'GDELT': 'SIGINT',
  };
  return map[source] || 'OSINT';
}

function decodeHtml(raw: string): string {
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => {
      const n = parseInt(code, 10);
      if (n === 8288 || n === 8203 || n === 8239 || n === 65279 || n < 32) return '';
      return String.fromCodePoint(n);
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const n = parseInt(hex, 16);
      if (n === 0x2060 || n === 0x200B || n === 0x202F || n === 0xFEFF || n < 32) return '';
      return String.fromCodePoint(n);
    })
    // Strip " - SourceName" suffix that Google News appends
    .replace(/\s*-\s*[A-Z][A-Za-z\s.]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ===== RSS PARSER =====
const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

async function fetchRSSFeed(feedConfig: typeof RSS_FEEDS[0]): Promise<FeedItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(feedConfig.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'T1-Terminal/1.0 (News Aggregator)' },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = xmlParser.parse(xml);
    const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    const itemArray = Array.isArray(items) ? items : [items];

    const now = Date.now();
    return itemArray.slice(0, 15).map((item: Record<string, unknown>) => {
      const title = (item.title as string) || '';
      const rawHeadline = typeof title === 'object' ? (title as Record<string, string>)['#text'] || '' : title;
      const headline = decodeHtml(rawHeadline);
      const pubDate = (item.pubDate as string) || (item.published as string) || (item.updated as string) || '';
      const link = (item.link as string) || ((item.link as Record<string, string>)?.['@_href']) || '';
      const timestamp = pubDate ? new Date(pubDate).getTime() : Date.now();
      const validTimestamp = isNaN(timestamp) ? Date.now() : timestamp;

      return {
        headline,
        source: mapSource(feedConfig.source),
        category: categorize(headline, feedConfig.defaultCategory),
        urgency: assignUrgency(headline),
        timestamp: validTimestamp,
        link: typeof link === 'string' ? link : '',
        region: feedConfig.region || detectRegion(headline),
        ticker: extractTicker(headline),
        storyline: detectStoryline(headline),
      };
    })
    .filter((item: FeedItem) => item.headline.length > 15)
    // *** 24-HOUR FILTER — only keep news from last 24 hours ***
    .filter((item: FeedItem) => (now - item.timestamp) < TWENTY_FOUR_HOURS);
  } catch { return []; }
}

// ===== FINNHUB NEWS =====
async function fetchFinnhubNews(): Promise<FeedItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const now = Date.now();
    return data.slice(0, 20).map((article: Record<string, unknown>) => {
      const headline = ((article.headline as string) || '').trim();
      const timestamp = ((article.datetime as number) || 0) * 1000;
      return {
        headline,
        source: 'FININT',
        category: categorize(headline, 'ECONOMICS'),
        urgency: assignUrgency(headline),
        timestamp: timestamp > 0 ? timestamp : Date.now(),
        link: (article.url as string) || '',
        region: detectRegion(headline),
        ticker: extractTicker(headline),
        storyline: detectStoryline(headline),
      };
    })
    .filter((item: FeedItem) => item.headline.length > 15)
    .filter((item: FeedItem) => (now - item.timestamp) < TWENTY_FOUR_HOURS);
  } catch { return []; }
}

// ===== GDELT (global geopolical context) =====
async function fetchGDELT(): Promise<FeedItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://api.gdeltproject.org/api/v2/doc/doc?query=&mode=ArtList&maxrecords=25&format=json&sort=DateDesc', { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    const articles = data?.articles || [];

    const now = Date.now();
    return articles.map((article: Record<string, unknown>) => {
      const headline = (article.title as string) || '';
      const timestamp = (article.seendate as string) ? new Date(article.seendate as string).getTime() : Date.now();
      const domain = (article.domain as string) || '';
      return {
        headline: headline.trim(),
        source: 'SIGINT',
        category: categorize(headline, 'GEOPOLITICS'),
        urgency: assignUrgency(headline),
        timestamp: isNaN(timestamp) ? Date.now() : timestamp,
        link: (article.url as string) || '',
        region: detectRegion(headline, domain),
        ticker: extractTicker(headline),
        storyline: detectStoryline(headline),
      };
    })
    .filter((item: FeedItem) => item.headline.length > 15)
    .filter((item: FeedItem) => (now - item.timestamp) < TWENTY_FOUR_HOURS);
  } catch { return []; }
}

// ===== ENGAGEMENT SCORING (0–100) =====
function computeEngagementScore(item: FeedItem): number {
  const now = Date.now();
  let score = 0;

  // Recency (0–30): exponential decay, half-life 2h
  const ageMs = now - item.timestamp;
  score += Math.max(0, 30 * Math.pow(0.5, ageMs / (2 * 60 * 60 * 1000)));

  // Urgency (0–25)
  const uScores: Record<string, number> = { FLASH: 25, URGENT: 18, BULLETIN: 10, NORMAL: 3 };
  score += uScores[item.urgency] || 3;

  // Hot keywords (0–15)
  const lower = item.headline.toLowerCase();
  let hot = 0;
  for (const kw of HOT_KEYWORDS) { if (lower.includes(kw.toLowerCase())) hot++; }
  score += Math.min(15, hot * 3);

  // Source authority (0–10)
  score += SOURCE_AUTHORITY[item.source] || 5;

  // Category relevance (0–10) — governance/IR/disaster/security prioritized
  const cScores: Record<string, number> = {
    GOVERNANCE: 10, IR: 10, DISASTER: 10, INTERNAL_SECURITY: 9,
    POLITICS: 9, ECONOMICS: 9, GEOPOLITICS: 9,
    ENVIRONMENT: 8, SCIENCE: 8, AGRICULTURE: 7,
    DEFENSE: 7, TECH: 7, MARKETS: 6, ENERGY: 6, CYBER: 6,
  };
  score += cScores[item.category] || 5;

  // Ticker (0–3)
  if (item.ticker) score += 3;

  // Storyline boost (0–5)
  if (item.storyline) score += 5;

  // India region boost (0–5)
  const rScores: Record<string, number> = { INDIA: 5, US: 3, MENA: 3, EU: 2, APAC: 2, CIS: 2 };
  if (item.region) score += rScores[item.region] || 1;

  return Math.max(1, Math.min(100, Math.round(score)));
}

// ===== CACHE =====
let cache: { data: FeedItem[]; timestamp: number } | null = null;
const CACHE_TTL = 45_000; // 45s
cache = null;

// ===== API HANDLER =====
export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({ items: cache.data, cached: true, sources: RSS_FEEDS.length + 2, timestamp: cache.timestamp });
  }

  const [rssResults, gdeltResults, finnhubResults] = await Promise.all([
    Promise.allSettled(RSS_FEEDS.map(fetchRSSFeed)),
    fetchGDELT(),
    fetchFinnhubNews(),
  ]);

  const rssItems = rssResults
    .filter((r): r is PromiseFulfilledResult<FeedItem[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);

  // Merge all → deduplicate → score → sort
  const allItems = [...rssItems, ...gdeltResults, ...finnhubResults];
  const seen = new Set<string>();
  const deduped = allItems.filter(item => {
    const key = item.headline.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (const item of deduped) { item.engagementScore = computeEngagementScore(item); }
  deduped.sort((a, b) => {
    const d = (b.engagementScore || 0) - (a.engagementScore || 0);
    return d !== 0 ? d : b.timestamp - a.timestamp;
  });

  cache = { data: deduped.slice(0, 150), timestamp: Date.now() };
  return NextResponse.json({ items: cache.data, cached: false, sources: RSS_FEEDS.length + 2, timestamp: cache.timestamp });
}
