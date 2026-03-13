/**
 * T1 Terminal — HFT Engine
 * 
 * Ultra-low-latency ticker system that bypasses React's reconciliation entirely.
 * Instead of re-rendering components on every tick, we mutate DOM nodes directly
 * via refs, achieving sub-millisecond UI updates at 100ms intervals.
 * 
 * Architecture:
 * 1. A single requestAnimationFrame loop drives all updates
 * 2. Market data is stored in plain mutable arrays (not React state)
 * 3. Registered DOM refs are updated via textContent/className mutations
 * 4. React components only render ONCE — all subsequent updates are pure DOM ops
 */

import { randomBetween } from '@/lib/utils';
import {
  INDICES, CURRENCIES, COMMODITIES, WATCHLIST,
  type MarketIndex, type CurrencyPair, type Commodity, type WatchlistItem,
} from '@/data/mock-data';
import { generateSparklineData } from '@/lib/utils';

// ===== MUTABLE DATA BUFFERS (zero-copy, no GC pressure) =====
export const indexBuffer: MarketIndex[] = INDICES.map(i => ({ ...i }));
export const currencyBuffer: CurrencyPair[] = CURRENCIES.map(c => ({ ...c }));
export const commodityBuffer: Commodity[] = COMMODITIES.map(c => ({ ...c }));
export const watchlistBuffer: WatchlistItem[] = WATCHLIST.map(w => ({
  ...w,
  sparkline: generateSparklineData(),
}));

// ===== DOM REF REGISTRY =====
type RefEntry = {
  valueEl: HTMLElement | null;
  changeEl: HTMLElement | null;
  badgeEl: HTMLElement | null;
  prevValue: number;
  onTick?: (newVal: number) => void;
};

const indexRefs: Map<string, Set<RefEntry>> = new Map();
const currencyRefs: Map<string, Set<RefEntry>> = new Map();
const commodityRefs: Map<string, Set<RefEntry>> = new Map();
const watchlistRefs: Map<string, Set<RefEntry>> = new Map();

export function registerIndexRef(symbol: string, entry: RefEntry) {
  if (!indexRefs.has(symbol)) indexRefs.set(symbol, new Set());
  indexRefs.get(symbol)!.add(entry);
  return () => { indexRefs.get(symbol)?.delete(entry); }
}
export function registerCurrencyRef(pair: string, entry: RefEntry) {
  if (!currencyRefs.has(pair)) currencyRefs.set(pair, new Set());
  currencyRefs.get(pair)!.add(entry);
  return () => { currencyRefs.get(pair)?.delete(entry); }
}
export function registerCommodityRef(symbol: string, entry: RefEntry) {
  if (!commodityRefs.has(symbol)) commodityRefs.set(symbol, new Set());
  commodityRefs.get(symbol)!.add(entry);
  return () => { commodityRefs.get(symbol)?.delete(entry); }
}
export function registerWatchlistRef(symbol: string, entry: RefEntry) {
  if (!watchlistRefs.has(symbol)) watchlistRefs.set(symbol, new Set());
  watchlistRefs.get(symbol)!.add(entry);
  return () => { watchlistRefs.get(symbol)?.delete(entry); }
}

// ===== FORMATTING (inlined for speed, avoid Intl overhead) =====
function fastFormatNumber(n: number, decimals = 2): string {
  return n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fastFormatPercent(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

// ===== FLASH ANIMATION (direct className manipulation) =====
function flashElement(el: HTMLElement | null, isUp: boolean) {
  if (!el) return;
  const cls = isUp ? 'hft-flash-green' : 'hft-flash-red';
  el.classList.add(cls);
  // Remove after animation completes (150ms)
  setTimeout(() => el.classList.remove(cls), 150);
}

// ===== TICK ENGINE =====
let running = false;
let lastTick = 0;
const TICK_INTERVAL = 100; // 100ms = 10 updates/sec, HFT-grade

function tickOnce() {
  // Mutate index buffer in-place
  for (let i = 0; i < indexBuffer.length; i++) {
    const idx = indexBuffer[i];
    const delta = randomBetween(-0.08, 0.08) * (idx.value / 1000);
    idx.value += delta;
    idx.change += delta;
    idx.changePercent = (idx.change / (idx.value - idx.change)) * 100;

    // Direct DOM update
    const refs = indexRefs.get(idx.symbol);
    if (refs) {
      const isUp = delta >= 0;
      refs.forEach(ref => {
        if (ref.valueEl) ref.valueEl.textContent = fastFormatNumber(idx.value);
        if (ref.changeEl) {
          ref.changeEl.textContent = `${isUp ? '▲' : '▼'} ${fastFormatPercent(idx.changePercent)}`;
          ref.changeEl.className = `text-[10px] font-bold px-1.5 py-0.5 rounded font-mono transition-colors duration-75 ${
            idx.change >= 0
              ? 'bg-[rgba(34,197,94,0.15)] text-[var(--t1-accent-green)]'
              : 'bg-[rgba(239,68,68,0.15)] text-[var(--t1-accent-red)]'
          }`;
        }
        flashElement(ref.valueEl, isUp);
        if (ref.onTick) ref.onTick(idx.value);
      });
    }
  }

  // Mutate currency buffer in-place
  for (let i = 0; i < currencyBuffer.length; i++) {
    const cur = currencyBuffer[i];
    const delta = randomBetween(-0.0003, 0.0003);
    cur.rate += delta;
    cur.change += delta;
    cur.changePercent = (cur.change / (cur.rate - cur.change)) * 100;

    const refs = currencyRefs.get(cur.pair);
    if (refs) {
      refs.forEach(ref => {
        if (ref.valueEl) ref.valueEl.textContent = cur.rate.toFixed(4);
        if (ref.changeEl) {
          ref.changeEl.textContent = fastFormatPercent(cur.changePercent);
          ref.changeEl.className = `text-[10px] font-mono font-bold w-16 text-right transition-colors duration-75 ${
            cur.change >= 0 ? 'text-[var(--t1-accent-green)]' : 'text-[var(--t1-accent-red)]'
          }`;
        }
        flashElement(ref.valueEl, delta >= 0);
      });
    }
  }

  // Mutate commodity buffer in-place
  for (let i = 0; i < commodityBuffer.length; i++) {
    const com = commodityBuffer[i];
    const delta = randomBetween(-0.05, 0.05) * (com.price / 100);
    com.price += delta;
    com.change += delta;
    com.changePercent = (com.change / (com.price - com.change)) * 100;

    const refs = commodityRefs.get(com.symbol);
    if (refs) {
      refs.forEach(ref => {
        if (ref.valueEl) {
          ref.valueEl.textContent = '$' + (com.price < 10 ? com.price.toFixed(3) : fastFormatNumber(com.price)) + com.unit;
        }
        if (ref.changeEl) {
          ref.changeEl.textContent = fastFormatPercent(com.changePercent);
          ref.changeEl.className = `text-[10px] font-mono font-bold w-16 text-right transition-colors duration-75 ${
            com.change >= 0 ? 'text-[var(--t1-accent-green)]' : 'text-[var(--t1-accent-red)]'
          }`;
        }
        flashElement(ref.valueEl, delta >= 0);
        if (ref.onTick) ref.onTick(com.price);
      });
    }
  }

  // Mutate watchlist buffer in-place
  for (let i = 0; i < watchlistBuffer.length; i++) {
    const item = watchlistBuffer[i];
    const delta = randomBetween(-0.15, 0.15);
    item.price += delta;
    item.change += delta;
    item.changePercent = (item.change / (item.price - item.change)) * 100;
    item.sparkline.shift();
    item.sparkline.push(item.price);

    const refs = watchlistRefs.get(item.symbol);
    if (refs) {
      refs.forEach(ref => {
        if (ref.valueEl) ref.valueEl.textContent = '$' + fastFormatNumber(item.price);
        if (ref.changeEl) {
          ref.changeEl.textContent = fastFormatPercent(item.changePercent);
          ref.changeEl.className = `text-[10px] font-mono transition-colors duration-75 ${
            item.change >= 0 ? 'text-[var(--t1-accent-green)]' : 'text-[var(--t1-accent-red)]'
          }`;
        }
        flashElement(ref.valueEl, delta >= 0);
      });
    }
  }
}

function loop(timestamp: number) {
  if (!running) return;
  if (timestamp - lastTick >= TICK_INTERVAL) {
    tickOnce();
    lastTick = timestamp;
  }
  requestAnimationFrame(loop);
}

export function startHFTEngine() {
  if (running) return;
  running = true;
  requestAnimationFrame(loop);
}

export function stopHFTEngine() {
  running = false;
  indexRefs.clear();
  currencyRefs.clear();
  commodityRefs.clear();
  watchlistRefs.clear();
}
