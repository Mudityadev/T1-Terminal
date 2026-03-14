'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  startWireEngine, stopWireEngine, playFlashAlert, fastRelativeTime,
  type IntelItem, type IntelCategory, type IntelUrgency,
} from '@/lib/wire-engine';
import { cn } from '@/lib/utils';
import { fireFlashAlert } from '@/components/FlashAlertBanner';
import { useAuth } from '@/components/AuthProvider';
import { saveNewsItem, unsaveNewsItem, fetchSavedHeadlines } from '@/lib/saved-news';
import { useMarketStore } from '@/store/market-store';
import { MiniTickerWidget } from '@/components/MiniTickerWidget';

import { commodityBuffer, indexBuffer, currencyBuffer } from '@/lib/hft-engine';
import {
  Zap, AlertTriangle, Radio, Bell, Volume2, VolumeX,
  ArrowUp, Signal, Activity, ExternalLink, Search,
  SortAsc, SortDesc, X, ChevronDown, Filter, Bookmark, BookmarkCheck, LogIn,
} from 'lucide-react';

// ===== CATEGORY CONFIG =====
type FilterCategory = 'ALL' | IntelCategory | 'FLASH' | 'UPSC' | 'INDIA';

const CATEGORY_CONFIG: Record<string, { color: string; label: string }> = {
  GOVERNANCE:       { color: '#8b5cf6', label: '🏛 GOVERNANCE' },
  POLITICS:         { color: '#3b82f6', label: '🗳 POLITICS' },
  IR:               { color: '#06b6d4', label: '🌐 IR' },
  ECONOMICS:        { color: '#f59e0b', label: '💰 ECONOMICS' },
  AGRICULTURE:      { color: '#84cc16', label: '🌾 AGRICULTURE' },
  ENVIRONMENT:      { color: '#10b981', label: '🌍 ENVIRONMENT' },
  DISASTER:         { color: '#ef4444', label: '🚨 DISASTER' },
  INTERNAL_SECURITY:{ color: '#dc2626', label: '🛡 INT. SECURITY' },
  SCIENCE:          { color: '#a855f7', label: '🔬 SCIENCE' },
  MARKETS:          { color: '#22c55e', label: '📈 MARKETS' },
  GEOPOLITICS:      { color: '#ef4444', label: '⚔ GEOPOLITICS' },
  TECH:             { color: '#06b6d4', label: '⚡ TECH' },
  ENERGY:           { color: '#fb923c', label: '🛢 ENERGY' },
  DEFENSE:          { color: '#a855f7', label: '🎯 DEFENSE' },
  CYBER:            { color: '#ec4899', label: '🔐 CYBER' },
  UPSC:             { color: '#eab308', label: '🎓 UPSC' },
  INDIA:            { color: '#f97316', label: '🇮🇳 INDIA' },
};

const FILTER_TABS: FilterCategory[] = ['ALL', 'FLASH', 'INDIA', 'GOVERNANCE', 'POLITICS', 'IR', 'ECONOMICS', 'ENVIRONMENT', 'DISASTER', 'SCIENCE', 'MARKETS', 'TECH', 'GEOPOLITICS', 'DEFENSE'];

// UPSC covers: Indian polity, governance, IR, economy, environment, S&T, defense, social issues
const UPSC_CATEGORIES: IntelCategory[] = ['POLITICS', 'ECONOMICS', 'GEOPOLITICS', 'DEFENSE', 'TECH', 'ENERGY', 'GOVERNANCE', 'IR', 'AGRICULTURE', 'ENVIRONMENT', 'DISASTER', 'INTERNAL_SECURITY', 'SCIENCE'];
const UPSC_KEYWORDS = [
  'india', 'indian', 'parliament', 'constitution', 'supreme court', 'policy', 'governance',
  'rbi', 'sebi', 'niti', 'modi', 'budget', 'inflation', 'gdp', 'imf', 'world bank',
  'nato', 'un ', 'united nations', 'g20', 'g7', 'brics', 'sco', 'quad',
  'climate', 'environment', 'carbon', 'renewable', 'nuclear', 'space', 'isro',
  'military', 'defense', 'security', 'sanction', 'treaty', 'bilateral',
  'election', 'democracy', 'human rights', 'refugee', 'migration',
  'vaccine', 'pandemic', 'health', 'education', 'poverty', 'inequality',
  'ai ', 'artificial intelligence', 'semiconductor', 'quantum', 'cyber',
];

// INDIA: keywords covering Indian politics, economy, companies, cities, diplomacy
const INDIA_KEYWORDS = [
  'india', 'indian', 'modi', 'bjp', 'congress party', 'delhi', 'mumbai', 'bangalore', 'chennai',
  'kolkata', 'hyderabad', 'rupee', 'bse', 'nse', 'sensex', 'nifty', 'rbi', 'sebi', 'niti aayog',
  'isro', 'tata', 'reliance', 'infosys', 'wipro', 'adani', 'ambani',
  'pakistan', 'kashmir', 'china border', 'lac ', 'line of actual control',
  'g20 india', 'quad india', 'sco india', 'brics india',
  'lok sabha', 'rajya sabha', 'supreme court of india', 'election commission',
  'aadhaar', 'upi', 'digital india', 'make in india',
];

const URGENCY_STYLES: Record<IntelUrgency, { border: string; bg: string; iconColor: string }> = {
  FLASH:   { border: 'border-red-500/50',    bg: 'bg-red-500/8',   iconColor: 'text-red-400' },
  URGENT:  { border: 'border-amber-500/30',  bg: 'bg-amber-500/5', iconColor: 'text-amber-400' },
  BULLETIN:{ border: 'border-blue-500/20',   bg: 'bg-blue-500/5',  iconColor: 'text-blue-400' },
  NORMAL:  { border: 'border-transparent',   bg: 'bg-transparent', iconColor: 'text-gray-500' },
};

const URGENCY_ICON: Record<IntelUrgency, typeof Zap> = {
  FLASH: Zap, URGENT: AlertTriangle, BULLETIN: Bell, NORMAL: Radio,
};

const SOURCE_CONFIG: Record<string, { icon: string; color: string }> = {
  'T1 WIRE': { icon: '◆', color: '#22c55e' },
  'SIGINT':  { icon: '◈', color: '#a855f7' },
  'GOVINT':  { icon: '◉', color: '#3b82f6' },
  'FININT':  { icon: '◇', color: '#f59e0b' },
  'OSINT':   { icon: '○', color: '#6b7280' },
};

const ALL_SOURCES = ['T1 WIRE', 'SIGINT', 'GOVINT', 'FININT', 'OSINT'] as const;
type SourceType = typeof ALL_SOURCES[number];
type SortMode = 'newest' | 'oldest' | 'urgency' | 'source';

const URGENCY_ORDER: Record<IntelUrgency, number> = { FLASH: 0, URGENT: 1, BULLETIN: 2, NORMAL: 3 };
const MAX_ITEMS = 200;
const CACHE_KEY = 't1_live_intel_cache_v1';


// ===== STABLE INLINE TICKER WIDGET =====
// Declared outside NewsFeed so React can cleanly reconcile its lifecycle.
// Rendering MiniTickerWidget as JSX stored in a variable inside a map() body
// caused React's insertBefore DOM error during concurrent reconciliation.
function InlineTickerByKey({ symbol }: { symbol: string }) {
  const cl = commodityBuffer.find(c => c.symbol === 'CL');
  const gc = commodityBuffer.find(c => c.symbol === 'GC');
  const zt = commodityBuffer.find(c => c.symbol === 'ZT');
  const spx = indexBuffer.find(i => i.symbol === 'SPX');

  if (symbol === 'CL' && cl)
    return <MiniTickerWidget symbol="CL" type="COMMODITY" initialValue={cl.price} initialChangePercent={cl.changePercent} />;
  if (symbol === 'GC' && gc)
    return <MiniTickerWidget symbol="GC" type="COMMODITY" initialValue={gc.price} initialChangePercent={gc.changePercent} />;
  if (symbol === 'SPX' && spx)
    return <MiniTickerWidget symbol="SPX" type="INDEX" initialValue={spx.value} initialChangePercent={spx.changePercent} />;
  if (symbol === 'ZT' && zt)
    return <MiniTickerWidget symbol="ZT" type="COMMODITY" initialValue={zt.price} initialChangePercent={zt.changePercent} />;
  return null;
}

export default function NewsFeed() {
  const [items, setItems] = useState<IntelItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [activeSources, setActiveSources] = useState<Set<SourceType>>(new Set(ALL_SOURCES));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [metrics, setMetrics] = useState({ ipm: 0, total: 0, latencyMs: 1, status: 'connecting' });
  const [isPaused, setIsPaused] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [followedStories, setFollowedStories] = useState<Set<string>>(new Set());
  const [mutedSources, setMutedSources] = useState<Set<string>>(new Set());
  const [mutedStories, setMutedStories] = useState<Set<string>>(new Set());
  const [briefForId, setBriefForId] = useState<string | null>(null);
  const [briefMode, setBriefMode] = useState<'10s' | '30s' | '2m' | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const soundRef = useRef(false);
  const pausedRef = useRef(false);
  const autoScrollRef = useRef(true);
  const seenIds = useRef<Set<string>>(new Set()); // client-side dedup

  const { user } = useAuth();
  const { watchlist } = useMarketStore();

  soundRef.current = soundEnabled;
  pausedRef.current = isPaused;

  // ===== Helpers for storyline & explanations =====
  function storylineKey(item: IntelItem): string {
    if (item.ticker) return `T:${item.ticker.toUpperCase()}`;
    if (item.region) return `R:${item.region.toLowerCase()}`;
    return `C:${item.category}`;
  }

  function whyThisMatters(item: IntelItem): { text: string; keywords: string; indicator: string } {
    const h = item.headline.toLowerCase();
    
    // Quick keyword extraction heuristic
    const extractKeys = (text: string) => {
      const words = text.split(/[\s,.-]+/);
      return words.filter(w => w.length > 5).slice(0, 2).map(w => w.toUpperCase()).join(' | ');
    };
    const keys = (item.headline || '').split(/[\s,.-]+/).filter(w => w.length > 5).slice(0, 2).map(w => w.toUpperCase()).join(' | ') || 'IMPACT | SIGNAL';

    if (item.category === 'MARKETS' || /stock|index|yield|bond|rally|crash/.test(h)) {
      return { 
        text: 'Shifts sentiment and risk across global markets and portfolios.',
        keywords: keys,
        indicator: 'VOLATILITY ⇡ | SENTIMENT SHIFT'
      };
    }
    if (item.category === 'GEOPOLITICS') {
      return {
        text: 'Alters geopolitical risk, trade flows, and regional stability.',
        keywords: keys,
        indicator: 'RISK FACTOR ☢ | MACRO IMPACT'
      };
    }
    if (item.category === 'ECONOMICS' || /inflation|gdp|recession|central bank/.test(h)) {
      return {
        text: 'Impacts growth expectations, central bank paths, and asset pricing.',
        keywords: keys,
        indicator: 'YIELD CURVE ∞ | SYSTEMIC SHOCK'
      };
    }
    if (item.category === 'TECH') {
      return {
        text: 'Repositions power in AI, chips, and critical infrastructure providers.',
        keywords: keys,
        indicator: 'DISRUPTION ⚡ | CAPEX SURGE'
      };
    }
    if (item.category === 'ENERGY') {
      return {
        text: 'Moves energy security, input costs, and inflation expectations.',
        keywords: keys,
        indicator: 'SUPPLY SHOCK 🛢 | COST PRESSURES'
      };
    }
    if (item.category === 'DEFENSE') {
      return {
        text: 'Signals shifts in hard power, deterrence, and conflict readiness.',
        keywords: keys,
        indicator: 'DEFCON ⚑ | DETERRENCE SHIFT'
      };
    }
    if (item.category === 'CYBER') {
      return {
        text: 'Changes operational risk surface across networks and critical systems.',
        keywords: keys,
        indicator: 'ZERO-DAY ☠ | ATTACK VECTOR'
      };
    }
    return {
      text: 'Changes the risk and opportunity landscape for operators watching this feed.',
      keywords: keys,
      indicator: 'ANOMALY DETECTED Ꙭ | MONITOR'
    };
  }

  function watchNextHint(item: IntelItem): string {
    if (item.category === 'GEOPOLITICS') {
      return 'Official statements, ceasefire moves, and market-open reaction.';
    }
    if (item.category === 'MARKETS') {
      return 'Futures, cash open, and cross-asset spillover into FX and credit.';
    }
    if (item.category === 'ECONOMICS') {
      return 'Central bank commentary, curve moves, and equity sector shifts.';
    }
    if (item.category === 'TECH') {
      return 'Earnings calls, regulator moves, and peer reactions in the sector.';
    }
    return 'Subsequent confirmations, policy moves, and how markets reprice this.';
  }

  function impactScore(item: IntelItem): number {
    // Use server-computed engagement score if available
    if (item.engagementScore) return item.engagementScore;
    // Fallback heuristic for mock items
    let base =
      item.urgency === 'FLASH' ? 80 :
      item.urgency === 'URGENT' ? 65 :
      item.urgency === 'BULLETIN' ? 50 :
      35;
    if (item.category === 'GEOPOLITICS' || item.category === 'ECONOMICS') base += 10;
    else if (item.category === 'MARKETS' || item.category === 'DEFENSE') base += 5;
    return Math.max(10, Math.min(99, Math.round(base)));
  }

  const handleNewItem = useCallback((item: IntelItem) => {
    // Client-side dedup — skip if we've already rendered this id or headline
    const hkey = (item.headline || '').toLowerCase().slice(0, 60);
    if (!item.id || seenIds.current.has(item.id) || seenIds.current.has(hkey)) return;
    seenIds.current.add(item.id);
    seenIds.current.add(hkey);

    if (item.urgency === 'FLASH') {
      fireFlashAlert(item.headline, item.source, item.link);
      if (soundRef.current) playFlashAlert();
    }
    setItems(prev => {
      const next = [item, ...prev];
      if (next.length > MAX_ITEMS) next.length = MAX_ITEMS;
      return next;
    });
    if (pausedRef.current) setNewCount(c => c + 1);
  }, []);

  const handleMetrics = useCallback((ipm: number, total: number, latencyMs: number, status: string) => {
    setMetrics({ ipm, total, latencyMs, status });
  }, []);

  // Hydrate from local cache so first paint is never empty
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as IntelItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setItems(parsed.slice(0, MAX_ITEMS));
      }
    } catch {
      // ignore cache errors
    }
  }, []);

  useEffect(() => {
    startWireEngine(handleNewItem, handleMetrics);
    return () => stopWireEngine();
  }, [handleNewItem, handleMetrics]);

  // Load saved headlines when user logs in
  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return; }
    fetchSavedHeadlines(user.id).then(setSavedIds);
  }, [user]);

  // Auto-scroll to top on new item — but NOT when user is hovering an item
  useEffect(() => {
    if (!isPaused && !hoveredId && feedRef.current && autoScrollRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [items.length, isPaused, hoveredId]);

  // Relative time ticker
  const [, setTimeTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTimeTick(t => t + 1), 5000);
    return () => clearInterval(iv);
  }, []);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchRef.current?.blur();
        setSearchQuery('');
        setShowSortMenu(false);
        setShowSourceMenu(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleScroll = useCallback(() => {
    if (!feedRef.current) return;
    if (feedRef.current.scrollTop < 20) {
      setIsPaused(false);
      setNewCount(0);
      autoScrollRef.current = true;
    } else {
      setIsPaused(true);
      autoScrollRef.current = false;
    }
  }, []);

  const scrollToTop = useCallback(() => {
    feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setIsPaused(false);
    setNewCount(0);
    autoScrollRef.current = true;
  }, []);

  const toggleSource = useCallback((src: SourceType) => {
    setActiveSources(prev => {
      const next = new Set(prev);
      if (next.has(src) && next.size > 1) next.delete(src);
      else next.add(src);
      return next;
    });
  }, []);

  // ===== Computed filtered + sorted items =====
  const displayedItems = useMemo(() => {
    let result = items;

    // Category/urgency/UPSC/INDIA filter
    if (activeFilter === 'FLASH') {
      result = result.filter(i => i.urgency === 'FLASH');
    } else if (activeFilter === 'UPSC') {
      result = result.filter(i =>
        UPSC_CATEGORIES.includes(i.category as IntelCategory) ||
        UPSC_KEYWORDS.some(kw => (i.headline || '').toLowerCase().includes(kw))
      );
    } else if (activeFilter === 'INDIA') {
      result = result.filter(i =>
        INDIA_KEYWORDS.some(kw => (i.headline || '').toLowerCase().includes(kw))
      );
    } else if (activeFilter !== 'ALL') {
      result = result.filter(i => i.category === activeFilter);
    }

    // Source filter
    if (activeSources.size < ALL_SOURCES.length) {
      result = result.filter(i => activeSources.has(i.source as SourceType));
    }

    // Mute filters (sources and storylines)
    if (mutedSources.size > 0 || mutedStories.size > 0) {
      result = result.filter((i) => {
        if (mutedSources.has(i.source)) return false;
        if (mutedStories.size > 0 && mutedStories.has(storylineKey(i))) return false;
        return true;
      });
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        (i.headline || '').toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q) ||
        (i.source || '').toLowerCase().includes(q) ||
        (i.ticker?.toLowerCase().includes(q)) ||
        (i.region?.toLowerCase().includes(q))
      );
    }

    // Sort
    const arr = [...result];
    if (sortMode === 'newest') arr.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    else if (sortMode === 'oldest') arr.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    else if (sortMode === 'urgency') arr.sort((a, b) => (URGENCY_ORDER[a.urgency] ?? 3) - (URGENCY_ORDER[b.urgency] ?? 3));
    else if (sortMode === 'source') arr.sort((a, b) => (a.source || '').localeCompare(b.source || ''));
    return arr;
  }, [items, activeFilter, activeSources, mutedSources, mutedStories, searchQuery, sortMode]);

  const flashCount   = useMemo(() => items.filter(i => i.urgency === 'FLASH').length, [items]);
  const urgentCount  = useMemo(() => items.filter(i => i.urgency === 'URGENT').length, [items]);
  const upscCount    = useMemo(() => items.filter(i =>
    UPSC_CATEGORIES.includes(i.category as IntelCategory) ||
    UPSC_KEYWORDS.some(kw => (i.headline || '').toLowerCase().includes(kw))
  ).length, [items]);
  const indiaCount   = useMemo(() => items.filter(i =>
    INDIA_KEYWORDS.some(kw => (i.headline || '').toLowerCase().includes(kw))
  ).length, [items]);
  const isFiltered   = searchQuery || activeFilter !== 'ALL' || activeSources.size < ALL_SOURCES.length;

  const sortLabels: Record<SortMode, string> = {
    newest: 'Newest First',
    oldest: 'Oldest First',
    urgency: 'By Urgency',
    source: 'By Source',
  };

  // Map tickers to latest snapshot from market store for richer context
  const tickerSnapshot = useMemo(() => {
    const map = new Map<string, { price: number; changePercent: number }>();
    for (const w of watchlist) {
      map.set(w.symbol.toUpperCase(), { price: w.price, changePercent: w.changePercent });
    }
    return map;
  }, [watchlist]);

  // Precompute simple "related signals" counts based on ticker / region / category
  const relatedKeyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    for (const i of items) {
      if (now - i.timestamp > DAY_MS) continue;
      const key =
        (i.ticker ? `T:${i.ticker.toUpperCase()}` : '') ||
        (i.region ? `R:${i.region.toLowerCase()}` : '') ||
        `C:${i.category}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  // Persist cache so landing is never empty
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (items.length === 0) return;
      const toStore = items.slice(0, 80);
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(toStore));
    } catch {
      // ignore
    }
  }, [items]);

  // ===== Keyboard shortcuts for operator productivity =====
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typingInInput = tag === 'INPUT' || tag === 'TEXTAREA';

      // Let the search input and other text fields behave normally
      if (typingInInput && e.key !== 'Escape') return;

      // ESC clears selection / menus when not typing
      if (e.key === 'Escape') {
        setSelectedId(null);
        setShowSortMenu(false);
        setShowSourceMenu(false);
        return;
      }

      // No items – nothing to navigate
      if (!displayedItems.length) return;

      const keyLower = e.key.toLowerCase();

      // Arrow key or Vim-style (j/k) navigation between items
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || keyLower === 'j' || keyLower === 'k') {
        e.preventDefault();
        const currentIndex = selectedId
          ? displayedItems.findIndex((i) => i.id === selectedId)
          : -1;
        const goingDown = e.key === 'ArrowDown' || keyLower === 'j';
        const nextIndex =
          goingDown
            ? Math.min(displayedItems.length - 1, currentIndex + 1)
            : Math.max(0, currentIndex === -1 ? displayedItems.length - 1 : currentIndex - 1);
        const nextItem = displayedItems[nextIndex];
        if (nextItem) {
          setSelectedId(nextItem.id);
          const el = document.querySelector<HTMLElement>(
            `[data-intel-id="${nextItem.id}"]`
          );
          el?.scrollIntoView({ block: 'nearest' });
        }
        return;
      }

      // Enter: open selected item link, if any
      if (e.key === 'Enter' && selectedId) {
        const item = displayedItems.find((i) => i.id === selectedId);
        if (item?.link) {
          window.open(item.link, '_blank', 'noopener,noreferrer');
        }
        return;
      }

      // F: quick toggle FLASH-only filter
      if (keyLower === 'f') {
        setActiveFilter((prev) => (prev === 'FLASH' ? 'ALL' : 'FLASH'));
        return;
      }

      // 1–4: quick category presets (ALL, FLASH, UPSC, INDIA)
      if (['1', '2', '3', '4'].includes(e.key)) {
        if (e.key === '1') setActiveFilter('ALL');
        if (e.key === '2') setActiveFilter('FLASH');
        if (e.key === '3') setActiveFilter('UPSC');
        if (e.key === '4') setActiveFilter('INDIA');
        return;
      }

      // S: save / unsave selected headline
      if (keyLower === 's' && selectedId) {
        const item = displayedItems.find((i) => i.id === selectedId);
        if (!item) return;
        if (!user) {
          setShowAuthGate(true);
          return;
        }
        const isSaved = savedIds.has(item.headline);
        const newSaved = new Set(savedIds);
        (async () => {
          if (isSaved) {
            newSaved.delete(item.headline);
            setSavedIds(newSaved);
            await unsaveNewsItem(user.id, item.headline);
          } else {
            newSaved.add(item.headline);
            setSavedIds(newSaved);
            await saveNewsItem({
              user_id: user.id,
              headline: item.headline.slice(0, 500),
              source: item.source,
              category: item.category,
              urgency: item.urgency,
              link: item.link ?? null,
              region: item.region ?? null,
              ticker: item.ticker ?? null,
            });
          }
        })();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [displayedItems, selectedId, savedIds, user, setSavedIds, setActiveFilter]);

  return (
    <div className="flex flex-col h-full min-h-0" onClick={() => { setShowSortMenu(false); setShowSourceMenu(false); }}>

      {/* ===== HEADER ===== */}
      <div className="px-2 sm:px-3 pt-1.5 sm:pt-2 pb-1.5 sm:pb-2 border-b border-[var(--t1-border)] space-y-1.5 sm:space-y-2">

        {/* Row 1: Title + metrics + sound */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60" />
            </div>
            <h1 className="text-[10px] sm:text-[11px] font-black tracking-[0.15em] text-white">LIVE INTELLIGENCE</h1>
          </div>
          {/* Metrics */}
          <div className="hidden sm:flex items-center gap-3 text-[9px] font-mono ml-2">
            <span className={cn('flex items-center gap-1', metrics.status === 'connected' ? 'text-[var(--t1-accent-green)]' : 'text-amber-400')}>
              <Activity size={8} className="animate-pulse-glow" />
              {metrics.status === 'connected' ? 'LIVE' : metrics.status === 'fallback' ? 'FALLBACK' : 'INIT'}
            </span>
            <span className="text-[var(--t1-text-muted)]">{metrics.ipm}/min</span>
            {metrics.latencyMs > 0 && <span className="hidden md:inline text-[var(--t1-text-muted)]"><Signal size={8} className="inline mr-0.5" />{metrics.latencyMs}ms</span>}
            <span className="text-[var(--t1-text-muted)]">{items.length} items</span>
          </div>
          <button
            onClick={() => setSoundEnabled(p => !p)}
            className="ml-auto p-1 rounded hover:bg-[var(--t1-bg-tertiary)] text-[var(--t1-text-muted)] hover:text-white transition-colors"
            title={soundEnabled ? 'Mute FLASH alerts' : 'Enable FLASH alerts (Ctrl+sound)'}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
        </div>

        {/* Row 2: Search */}
        <div className="flex items-center bg-[var(--t1-bg-primary)] border border-[var(--t1-border)] rounded-lg focus-within:border-[var(--t1-border-glow)] focus-within:shadow-[0_0_0_1px_var(--t1-border-glow)] transition-all">
          <span className="pl-3 pr-2 shrink-0 flex items-center">
            <Search size={14} className="text-[var(--t1-text-muted)]" />
          </span>
          <input
            autoComplete="off"
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder='Search headlines, source, region, ticker… (press "/")'
            className="flex-1 min-w-0 bg-transparent py-2.5 pr-2 text-sm text-[var(--t1-text-primary)] placeholder:text-[var(--t1-text-muted)] outline-none font-mono"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="px-2 shrink-0 text-[var(--t1-text-muted)] hover:text-white transition-colors">
              <X size={11} />
            </button>
          )}
        </div>

        {/* Row 3: Category tabs */}
        <div className="flex flex-wrap gap-0.5 sm:gap-1">
          {FILTER_TABS.map(cat => {
            const isActive = activeFilter === cat;
            const color = cat === 'ALL' ? '#6b7280' : cat === 'FLASH' ? '#ef4444' : (CATEGORY_CONFIG[cat]?.color || '#6b7280');
                const count = cat === 'FLASH' ? flashCount
                  : cat === 'ALL' ? items.length
                  : cat === 'UPSC' ? upscCount
                  : cat === 'INDIA' ? indiaCount
                  : items.filter(i => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={cn(
                  'px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold tracking-wider border transition-all duration-100',
                  isActive ? 'text-white' : 'text-[var(--t1-text-muted)] hover:text-[var(--t1-text-secondary)] border-transparent'
                )}
                style={isActive ? { backgroundColor: color + '25', borderColor: color + '60', color } : undefined}
              >
                {cat}
                {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Row 4: Sort + Source filter + results count */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Sort dropdown */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setShowSortMenu(p => !p); setShowSourceMenu(false); }}
              className="flex items-center gap-1 px-2 py-1 rounded border border-[var(--t1-border)] text-[9px] text-[var(--t1-text-secondary)] hover:border-[var(--t1-border-glow)] hover:text-white transition-colors font-mono"
            >
              {sortMode === 'oldest' ? <SortAsc size={10} /> : <SortDesc size={10} />}
              {sortLabels[sortMode]}
              <ChevronDown size={9} />
            </button>
            {showSortMenu && (
              <div className="absolute top-full mt-1 left-0 z-50 bg-[var(--t1-bg-secondary)] border border-[var(--t1-border)] rounded-lg shadow-xl min-w-[130px] py-1 animate-fade-in-up">
                {(Object.keys(sortLabels) as SortMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setSortMode(mode); setShowSortMenu(false); }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-[10px] font-mono hover:bg-[var(--t1-bg-tertiary)] transition-colors',
                      sortMode === mode ? 'text-[var(--t1-accent-green)]' : 'text-[var(--t1-text-secondary)]'
                    )}
                  >
                    {sortLabels[mode]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Source filter dropdown */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setShowSourceMenu(p => !p); setShowSortMenu(false); }}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded border text-[9px] transition-colors font-mono',
                activeSources.size < ALL_SOURCES.length
                  ? 'border-[var(--t1-accent-cyan)] text-[var(--t1-accent-cyan)]'
                  : 'border-[var(--t1-border)] text-[var(--t1-text-secondary)] hover:border-[var(--t1-border-glow)] hover:text-white'
              )}
            >
              <Filter size={9} />
              SOURCES {activeSources.size < ALL_SOURCES.length && `(${activeSources.size}/${ALL_SOURCES.length})`}
              <ChevronDown size={9} />
            </button>
            {showSourceMenu && (
              <div className="absolute top-full mt-1 left-0 z-50 bg-[var(--t1-bg-secondary)] border border-[var(--t1-border)] rounded-lg shadow-xl min-w-[150px] py-1 animate-fade-in-up">
                {ALL_SOURCES.map(src => {
                  const cfg = SOURCE_CONFIG[src];
                  const active = activeSources.has(src);
                  return (
                    <button
                      key={src}
                      onClick={() => toggleSource(src)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono hover:bg-[var(--t1-bg-tertiary)] transition-colors"
                    >
                      <span style={{ color: active ? cfg.color : '#6b7280' }}>{cfg.icon}</span>
                      <span className={active ? 'text-white' : 'text-[var(--t1-text-muted)]'}>{src}</span>
                      {active && <span className="ml-auto text-[var(--t1-accent-green)]">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Results count */}
          <span className="text-[8px] sm:text-[9px] text-[var(--t1-text-muted)] font-mono ml-auto">
            {displayedItems.length} result{displayedItems.length !== 1 ? 's' : ''}
            {isFiltered && ' (filtered)'}
          </span>

          {/* Clear all filters */}
          {isFiltered && (
            <button
              onClick={() => { setSearchQuery(''); setActiveFilter('ALL'); setActiveSources(new Set(ALL_SOURCES)); }}
              className="flex items-center gap-1 text-[9px] text-[var(--t1-text-muted)] hover:text-[var(--t1-accent-red)] transition-colors font-mono"
            >
              <X size={9} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ===== SCROLL-TO-TOP BANNER ===== */}
      {isPaused && newCount > 0 && (
        <button
          onClick={scrollToTop}
          className="flex items-center justify-center gap-2 py-1.5 bg-[var(--t1-accent-green)]/10 border-b border-[var(--t1-accent-green)]/30 text-[var(--t1-accent-green)] text-xs font-bold font-mono hover:bg-[var(--t1-accent-green)]/20 transition-colors"
        >
          <ArrowUp size={12} />
          {newCount} new {newCount === 1 ? 'item' : 'items'} — click to jump to top
        </button>
      )}

      {/* ===== FEED ===== */}
      <div ref={feedRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-3">
        {displayedItems.map((item, index) => {
          const style = URGENCY_STYLES[item.urgency] || URGENCY_STYLES['NORMAL'];
          const Icon = URGENCY_ICON[item.urgency] || URGENCY_ICON['NORMAL'];
          const catCfg = CATEGORY_CONFIG[item.category];
          const srcCfg = SOURCE_CONFIG[item.source] || { icon: '○', color: '#6b7280' };
          const isNewest = index === 0 && !isPaused && !searchQuery;
          const isSelected = selectedId === item.id;
          const isSaved = savedIds.has(item.headline);
          const hasLink = Boolean(item.link);
          const tickerInfo = item.ticker ? tickerSnapshot.get(item.ticker.toUpperCase()) : undefined;
          const relatedKey =
            (item.ticker ? `T:${item.ticker.toUpperCase()}` : '') ||
            (item.region ? `R:${item.region.toLowerCase()}` : '') ||
            `C:${item.category}`;
          const relatedCount = relatedKeyCounts.get(relatedKey) ?? 0;

          // Contextual matching logic for inline widgets
          let inlineWidgetKey: string | null = null;
          const headlineLower = item.headline.toLowerCase();
          
          if (item.category === 'ENERGY' || headlineLower.includes('oil') || headlineLower.includes('crude')) {
            const cl = commodityBuffer.find(c => c.symbol === 'CL');
            if (cl) inlineWidgetKey = 'CL';
          } else if (headlineLower.includes('gold') || headlineLower.includes('precious')) {
            const gc = commodityBuffer.find(c => c.symbol === 'GC');
            if (gc) inlineWidgetKey = 'GC';
          } else if (item.category === 'MARKETS' || headlineLower.includes('s&p') || headlineLower.includes('stocks')) {
            const spx = indexBuffer.find(i => i.symbol === 'SPX');
            if (spx) inlineWidgetKey = 'SPX';
          } else if (headlineLower.includes('fed') || headlineLower.includes('rates') || headlineLower.includes('bond')) {
            const zt = commodityBuffer.find(c => c.symbol === 'ZT');
            if (zt) inlineWidgetKey = 'ZT';
          }

          return (
            <div
              key={item.id}
              data-intel-id={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                'group relative rounded-lg border transition-all duration-200 overflow-hidden',
                'bg-[var(--t1-bg-secondary)] hover:bg-[var(--t1-bg-tertiary)]/50',
                style.border,
                hoveredId === item.id && 'border-[var(--t1-border-glow)] shadow-[var(--t1-glow-green)]',
                isSelected && 'ring-1 ring-[var(--t1-accent-green)] border-[var(--t1-border-glow)]'
              )}
            >
              {/* === MAIN CONTENT === */}
              <div className="flex w-full h-full">

                {/* Left side: Text content (Approx 85-90%) */}
                <div className="flex-1 min-w-0 p-3 sm:p-4 space-y-2">
                  {/* Tag row */}
                  <div className="flex items-center flex-wrap gap-1.5">
                    {item.urgency !== 'NORMAL' && (
                      <span className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest uppercase',
                        item.urgency === 'FLASH'    && 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse-glow',
                        item.urgency === 'URGENT'   && 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
                        item.urgency === 'BULLETIN' && 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
                      )}>
                        <Icon size={8} />
                        {item.urgency}
                      </span>
                    )}
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border"
                      style={{ color: catCfg?.color || '#78716c', backgroundColor: (catCfg?.color || '#78716c') + '15', borderColor: (catCfg?.color || '#78716c') + '30' }}
                    >
                      {item.category}
                    </span>
                    {item.region && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono border border-[var(--t1-border)] text-[var(--t1-text-muted)]">
                        {item.region}
                      </span>
                    )}
                    <span className="ml-auto text-[10px] text-[var(--t1-text-muted)] font-mono tabular-nums shrink-0">
                      {fastRelativeTime(item.timestamp)}{' · '}
                      <span className="hidden sm:inline">{new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
                    </span>
                  </div>

                  {/* Headline */}
                  {hasLink ? (
                    <a href={item.link!} target="_blank" rel="noopener noreferrer"
                      className={cn(
                        'block text-[13px] sm:text-[15px] leading-snug tracking-tight hover:underline decoration-[var(--t1-text-muted)]/30 underline-offset-2',
                        item.urgency === 'FLASH'    && 'text-white font-bold',
                        item.urgency === 'URGENT'   && 'text-[var(--t1-text-primary)] font-semibold',
                        item.urgency === 'BULLETIN' && 'text-[var(--t1-text-primary)] font-medium',
                        item.urgency === 'NORMAL'   && 'text-[var(--t1-text-secondary)] font-normal',
                      )}>
                      {item.headline}
                    </a>
                  ) : (
                    <p className={cn(
                      'text-[13px] sm:text-[15px] leading-snug tracking-tight',
                      item.urgency === 'FLASH'    && 'text-white font-bold',
                      item.urgency === 'URGENT'   && 'text-[var(--t1-text-primary)] font-semibold',
                      item.urgency === 'BULLETIN' && 'text-[var(--t1-text-primary)] font-medium',
                      item.urgency === 'NORMAL'   && 'text-[var(--t1-text-secondary)] font-normal',
                    )}>
                      {item.headline}
                    </p>
                  )}

                  {/* Storyline & Sentiment tags */}
                  {(item.storyline || (item.sentiment && item.sentiment !== 'NEUTRAL')) && (
                    <div className="flex items-center flex-wrap gap-2">
                      {item.storyline && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--t1-accent-orange)]/15 text-[var(--t1-accent-orange)] border border-[var(--t1-accent-orange)]/25">
                          📌 {item.storyline}
                        </span>
                      )}
                      {item.sentiment && item.sentiment !== 'NEUTRAL' && (
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border",
                          item.sentiment === 'BULLISH' 
                            ? 'bg-[var(--t1-accent-green)]/15 text-[var(--t1-accent-green)] border-[var(--t1-accent-green)]/25'
                            : 'bg-[var(--t1-accent-red)]/15 text-[var(--t1-accent-red)] border-[var(--t1-accent-red)]/25'
                        )}>
                          {item.sentiment === 'BULLISH' ? '🚀 BULLISH' : '🩸 BEARISH'}
                        </span>
                      )}
                    </div>
                  )}

                    {/* Description & Indicator */}
                    <div className="flex gap-4 items-start w-full">
                      <div className="space-y-1.5 flex-1 w-full overflow-hidden">
                        <p className="text-[11px] sm:text-xs leading-relaxed text-[var(--t1-text-muted)] font-medium">
                          <span className="text-[10px] sm:text-[11px] font-bold text-[var(--t1-text-primary)] tracking-wide uppercase mr-1">
                            [{whyThisMatters(item).indicator}]
                          </span>
                          {whyThisMatters(item).text}
                        </p>
                        <p className="text-[9px] font-mono tracking-widest text-[var(--t1-accent-orange)]/80 uppercase truncate">
                          {whyThisMatters(item).keywords}
                        </p>
                      </div>
                      
                      {/* Right-aligned inline ticker widget */}
                      {inlineWidgetKey && (
                        <div className="hidden sm:block shrink-0 pt-0.5 animate-fade-in">
                          <InlineTickerByKey symbol={inlineWidgetKey} />
                        </div>
                      )}
                    </div>

                    {/* Brief */}
                    {briefForId === item.id && briefMode && (
                      <div className="rounded bg-[var(--t1-bg-primary)] border border-[var(--t1-border)] px-3 py-2 text-xs text-[var(--t1-text-secondary)] space-y-1">
                        {briefMode === '10s' && <p>{item.headline}</p>}
                        {briefMode === '30s' && (
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>What: {item.headline}</li>
                            <li>Why: {whyThisMatters(item).text}</li>
                            <li>Next: {watchNextHint(item)}</li>
                          </ul>
                        )}
                        {briefMode === '2m' && (
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>What: {item.headline}</li>
                            <li>Why: {whyThisMatters(item).text}</li>
                            <li>Status: {item.urgency === 'FLASH' ? 'Escalated to FLASH.' : 'Evolving.'}</li>
                            <li>Next: {watchNextHint(item)}</li>
                          </ul>
                        )}
                      </div>
                    )}

                    {/* === BOTTOM ROW: source + actions === */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--t1-border)]/30">
                      <span className="text-[10px] font-mono" style={{ color: srcCfg.color }}>
                        via <span className="font-bold">{item.source}</span>
                      </span>
                      {relatedCount > 1 && (
                        <span className="text-[9px] font-mono text-[var(--t1-text-muted)]">· {relatedCount} sources</span>
                      )}
                      <span className="flex-1" />
                      <span className="text-[10px] font-mono text-[var(--t1-accent-orange)]">🔥 {impactScore(item)}</span>
                      <div className="flex items-center gap-0.5 text-[10px] font-mono text-[var(--t1-text-muted)]">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!user) { setShowAuthGate(true); return; }
                            const newSaved = new Set(savedIds);
                            if (isSaved) {
                              newSaved.delete(item.headline);
                              setSavedIds(newSaved);
                              await unsaveNewsItem(user.id, item.headline);
                            } else {
                              newSaved.add(item.headline);
                              setSavedIds(newSaved);
                              await saveNewsItem({ user_id: user.id, headline: item.headline.slice(0, 500), source: item.source, category: item.category, urgency: item.urgency, link: item.link ?? null, region: item.region ?? null, ticker: item.ticker ?? null });
                            }
                          }}
                          className={cn('px-1 py-0.5 rounded hover:bg-[var(--t1-bg-tertiary)] transition-colors', isSaved ? 'text-[var(--t1-accent-green)]' : 'hover:text-[var(--t1-accent-green)]')}
                        >
                          [ {isSaved ? 'saved' : 'save'} ]
                        </button>
                        {hasLink && (
                          <a href={item.link!} target="_blank" rel="noopener noreferrer" className="px-1 py-0.5 rounded hover:bg-[var(--t1-bg-tertiary)] hover:text-white transition-colors">
                            [ share ]
                          </a>
                        )}
                      </div>
                    </div>
                  </div>


                </div>
              </div>
            );
          })}

        {/* Empty states */}
        {displayedItems.length === 0 && items.length > 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <Search size={24} className="text-[var(--t1-text-muted)]" />
            <div>
              <p className="text-sm text-[var(--t1-text-secondary)] font-medium">No results found</p>
              <p className="text-xs text-[var(--t1-text-muted)] font-mono mt-1">Try adjusting your search or filters</p>
            </div>
            <button
              onClick={() => { setSearchQuery(''); setActiveFilter('ALL'); setActiveSources(new Set(ALL_SOURCES)); }}
              className="text-xs text-[var(--t1-accent-green)] font-mono hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Signal size={24} className="text-[var(--t1-accent-green)] animate-pulse-glow" />
            <p className="text-sm text-[var(--t1-text-muted)] font-mono">Establishing secure channel...</p>
          </div>
        )}
      </div>

      {/* ===== FOOTER ===== */}
      <div className="px-2 sm:px-3 py-1 sm:py-1.5 border-t border-[var(--t1-border)] flex items-center justify-between text-[8px] sm:text-[9px] font-mono">
        <div className="flex items-center gap-3">
          <span className="text-red-400 font-bold">{flashCount} FLASH</span>
          <span className="text-amber-400">{urgentCount} URGENT</span>
          <span className="text-[var(--t1-text-muted)]">{items.length} in feed</span>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <a href="/saved" className="flex items-center gap-1 text-[var(--t1-accent-green)] hover:underline">
              <BookmarkCheck size={9} /> Saved ({savedIds.size})
            </a>
          )}
          <div className={cn('flex items-center gap-1.5', metrics.status === 'connected' ? 'text-[var(--t1-accent-green)]' : 'text-amber-400')}>
            <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse-glow', metrics.status === 'connected' ? 'bg-[var(--t1-accent-green)]' : 'bg-amber-400')} />
            {metrics.status === 'connected' ? 'RSS + GDELT LIVE' : 'MOCK DATA'}
          </div>
        </div>
      </div>

      {/* ===== AUTH GATE MODAL ===== */}
      {showAuthGate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowAuthGate(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-xs glass rounded-2xl border border-[var(--t1-border-glow)] p-6 text-center space-y-4 animate-fade-in-up"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAuthGate(false)} className="absolute top-3 right-3 text-[var(--t1-text-muted)] hover:text-white transition-colors">
              <X size={14} />
            </button>
            <div className="w-12 h-12 rounded-full bg-[var(--t1-accent-green)]/10 border border-[var(--t1-accent-green)]/30 flex items-center justify-center mx-auto">
              <Bookmark size={20} className="text-[var(--t1-accent-green)]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Sign in to save articles</h2>
              <p className="text-xs text-[var(--t1-text-muted)]">Bookmark news and review them later from your Saved Feed.</p>
            </div>
            <a href="/login" className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--t1-accent-green)]/20 border border-[var(--t1-accent-green)]/40 text-[var(--t1-accent-green)] text-sm font-bold hover:bg-[var(--t1-accent-green)]/30 transition-colors">
              <LogIn size={13} /> Sign In
            </a>
            <button onClick={() => setShowAuthGate(false)} className="w-full text-xs text-[var(--t1-text-muted)] hover:text-white font-mono transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
