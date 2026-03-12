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
import {
  Zap, AlertTriangle, Radio, Bell, Volume2, VolumeX,
  ArrowUp, Signal, Activity, ExternalLink, Search,
  SortAsc, SortDesc, X, ChevronDown, Filter, Bookmark, BookmarkCheck, LogIn,
} from 'lucide-react';

// ===== CATEGORY CONFIG =====
type FilterCategory = 'ALL' | IntelCategory | 'FLASH' | 'UPSC' | 'INDIA';

const CATEGORY_CONFIG: Record<string, { color: string; label: string }> = {
  MARKETS:    { color: '#22c55e', label: '📈 MARKETS' },
  POLITICS:   { color: '#3b82f6', label: '🏛 POLITICS' },
  ECONOMICS:  { color: '#f59e0b', label: '💰 ECONOMICS' },
  GEOPOLITICS:{ color: '#ef4444', label: '🌍 GEOPOLITICS' },
  TECH:       { color: '#06b6d4', label: '⚡ TECH' },
  ENERGY:     { color: '#fb923c', label: '🛢 ENERGY' },
  DEFENSE:    { color: '#a855f7', label: '🛡 DEFENSE' },
  CYBER:      { color: '#ec4899', label: '🔐 CYBER' },
  UPSC:       { color: '#eab308', label: '🎓 UPSC' },
  INDIA:      { color: '#f97316', label: '🇮🇳 INDIA' },
};

const FILTER_TABS: FilterCategory[] = ['ALL', 'FLASH', 'UPSC', 'INDIA', 'MARKETS', 'ECONOMICS', 'GEOPOLITICS', 'POLITICS', 'TECH', 'ENERGY', 'DEFENSE', 'CYBER'];

// UPSC covers: Indian polity, governance, IR, economy, environment, S&T, defense, social issues
const UPSC_CATEGORIES: IntelCategory[] = ['POLITICS', 'ECONOMICS', 'GEOPOLITICS', 'DEFENSE', 'TECH', 'ENERGY'];
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

  const handleNewItem = useCallback((item: IntelItem) => {
    // Client-side dedup — skip if we've already rendered this id or headline
    const hkey = item.headline.toLowerCase().slice(0, 60);
    if (seenIds.current.has(item.id) || seenIds.current.has(hkey)) return;
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
        UPSC_KEYWORDS.some(kw => i.headline.toLowerCase().includes(kw))
      );
    } else if (activeFilter === 'INDIA') {
      result = result.filter(i =>
        INDIA_KEYWORDS.some(kw => i.headline.toLowerCase().includes(kw))
      );
    } else if (activeFilter !== 'ALL') {
      result = result.filter(i => i.category === activeFilter);
    }

    // Source filter
    if (activeSources.size < ALL_SOURCES.length) {
      result = result.filter(i => activeSources.has(i.source as SourceType));
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.headline.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.source.toLowerCase().includes(q) ||
        (i.ticker?.toLowerCase().includes(q)) ||
        (i.region?.toLowerCase().includes(q))
      );
    }

    // Sort
    const arr = [...result];
    if (sortMode === 'newest') arr.sort((a, b) => b.timestamp - a.timestamp);
    else if (sortMode === 'oldest') arr.sort((a, b) => a.timestamp - b.timestamp);
    else if (sortMode === 'urgency') arr.sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);
    else if (sortMode === 'source') arr.sort((a, b) => a.source.localeCompare(b.source));
    return arr;
  }, [items, activeFilter, activeSources, searchQuery, sortMode]);

  const flashCount   = useMemo(() => items.filter(i => i.urgency === 'FLASH').length, [items]);
  const urgentCount  = useMemo(() => items.filter(i => i.urgency === 'URGENT').length, [items]);
  const upscCount    = useMemo(() => items.filter(i =>
    UPSC_CATEGORIES.includes(i.category as IntelCategory) ||
    UPSC_KEYWORDS.some(kw => i.headline.toLowerCase().includes(kw))
  ).length, [items]);
  const indiaCount   = useMemo(() => items.filter(i =>
    INDIA_KEYWORDS.some(kw => i.headline.toLowerCase().includes(kw))
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
      <div ref={feedRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-1.5 sm:p-2 space-y-1.5">
        {displayedItems.map((item, index) => {
          const style = URGENCY_STYLES[item.urgency];
          const Icon = URGENCY_ICON[item.urgency];
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

          return (
            <div
              key={item.id}
              data-intel-id={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                'group relative flex flex-col gap-1.5 px-2 sm:px-3 py-2.5 sm:py-3 rounded-lg border transition-all duration-150',
                style.border,
                style.bg,
                isNewest && 'animate-slide-in-right',
                item.urgency === 'FLASH' && 'hft-news-flash',
                hoveredId === item.id && 'brightness-125',
                isSelected && 'ring-1 ring-[var(--t1-accent-green)] ring-offset-0 border-[var(--t1-border-glow)]'
              )}
            >
              {/* === TAG ROW === */}
              <div className="flex items-center flex-wrap gap-1.5">
                {/* Urgency badge */}
                {item.urgency !== 'NORMAL' && (
                  <span className={cn(
                    'inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-sm text-[8px] sm:text-[9px] font-black tracking-widest',
                    item.urgency === 'FLASH'    && 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse-glow',
                    item.urgency === 'URGENT'   && 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
                    item.urgency === 'BULLETIN' && 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
                  )}>
                    <Icon size={8} />
                    {item.urgency}
                  </span>
                )}
                {/* Category tag */}
                <span
                  className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-sm text-[8px] sm:text-[9px] font-bold tracking-wider border"
                  style={{ color: catCfg?.color || '#6b7280', backgroundColor: (catCfg?.color || '#6b7280') + '18', borderColor: (catCfg?.color || '#6b7280') + '35' }}
                >
                  {catCfg?.label || item.category}
                </span>
                {/* Ticker with mini snapshot, if available */}
                {item.ticker && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[8px] sm:text-[9px] font-mono border border-[var(--t1-accent-cyan)]/30 bg-[var(--t1-accent-cyan)]/10 text-[var(--t1-accent-cyan)]">
                    <span className="font-bold">${item.ticker}</span>
                    {tickerInfo && (
                      <span className="text-[var(--t1-text-primary)]">
                        {tickerInfo.price.toFixed(2)}
                        {' '}
                        <span className={tickerInfo.changePercent >= 0 ? 'text-[var(--t1-accent-green)]' : 'text-[var(--t1-accent-red)]'}>
                          {tickerInfo.changePercent >= 0 ? '+' : ''}{tickerInfo.changePercent.toFixed(2)}%
                        </span>
                      </span>
                    )}
                  </span>
                )}
                {/* Region */}
                {item.region && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[8px] sm:text-[9px] font-mono border border-[var(--t1-border)] text-[var(--t1-text-muted)]" title={item.region}>
                    <span>{item.region}</span>
                  </span>
                )}
                {/* Time */}
                <span className="ml-auto text-[9px] sm:text-[10px] text-[var(--t1-text-muted)] font-mono tabular-nums">
                  {fastRelativeTime(item.timestamp)}
                </span>
              </div>

              {/* === HEADLINE — clickable link === */}
              {hasLink ? (
                <a href={item.link!} target="_blank" rel="noopener noreferrer"
                  className={cn(
                    'text-[11px] sm:text-[12px] leading-snug tracking-tight hover:underline cursor-pointer',
                    item.urgency === 'FLASH'    && 'text-white font-bold',
                    item.urgency === 'URGENT'   && 'text-[var(--t1-text-primary)] font-semibold',
                    item.urgency === 'BULLETIN' && 'text-[var(--t1-text-primary)] font-medium',
                    item.urgency === 'NORMAL'   && 'text-[var(--t1-text-secondary)] font-normal',
                  )}>
                  {item.headline}
                </a>
              ) : (
                <p className={cn(
                  'text-[11px] sm:text-[12px] leading-snug tracking-tight',
                  item.urgency === 'FLASH'    && 'text-white font-bold',
                  item.urgency === 'URGENT'   && 'text-[var(--t1-text-primary)] font-semibold',
                  item.urgency === 'BULLETIN' && 'text-[var(--t1-text-primary)] font-medium',
                  item.urgency === 'NORMAL'   && 'text-[var(--t1-text-secondary)] font-normal',
                )}>
                  {item.headline}
                </p>
              )}

              {/* === SOURCE ROW + ACTIONS === */}
              <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                <span className="text-[8px] sm:text-[9px] font-mono font-bold" style={{ color: srcCfg.color }}>
                  {srcCfg.icon} {item.source}
                </span>
                {relatedCount > 1 && (
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-sm text-[8px] font-mono bg-[var(--t1-bg-tertiary)] text-[var(--t1-text-muted)] border border-[var(--t1-border)]">
                    {relatedCount} in last 24h
                  </span>
                )}
                {/* Open article link */}
                {hasLink && (
                  <a href={item.link!} target="_blank" rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-1 text-[8px] sm:text-[9px] text-[var(--t1-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity hover:text-white">
                    <ExternalLink size={9} /> Open article
                  </a>
                )}
                {/* Bookmark button */}
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
                  }}
                  title={isSaved ? 'Unsave' : 'Save for later'}
                  className={cn(
                    'ml-auto flex items-center gap-1 p-1 rounded transition-all',
                    isSaved
                      ? 'text-[var(--t1-accent-green)]'
                      : 'text-[var(--t1-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--t1-accent-green)]',
                  )}
                >
                  {isSaved ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
                </button>
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
