'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useMarketStore } from '@/store/market-store';
import {
  indexBuffer, currencyBuffer, commodityBuffer,
  registerIndexRef, registerCurrencyRef, registerCommodityRef,
} from '@/lib/hft-engine';
import { cn } from '@/lib/utils';
import FearGreedGauge from './FearGreedGauge';
import RegionBarChart from './RegionBarChart';
import InterlinkageMap from './InterlinkageMap';
import SparklineChart from './SparklineChart';

// ===== HFT INDEX CARD (registers DOM refs, never re-renders after mount) =====
const HFTIndexCard = memo(function HFTIndexCard({ symbol, name, initialValue, initialChange, initialChangePercent }: {
  symbol: string; name: string; initialValue: number; initialChange: number; initialChangePercent: number;
}) {
  const valueRef = useRef<HTMLDivElement>(null);
  const changeRef = useRef<HTMLSpanElement>(null);
  
  // Local state purely to drive the sparkline animation (20 data points)
  const [history, setHistory] = useState<number[]>(() => Array(20).fill(initialValue));
  const isPositive = initialChangePercent >= 0;

  useEffect(() => {
    return registerIndexRef(symbol, {
      valueEl: valueRef.current,
      changeEl: changeRef.current,
      badgeEl: null,
      prevValue: initialValue,
      onTick: (newVal: number) => {
        setHistory(prev => [...prev.slice(1), newVal]);
      }
    });
  }, [symbol, initialValue]);

  return (
    <div className="glass glass-hover rounded-lg p-2.5 transition-all duration-100 cursor-pointer group relative overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold tracking-wider text-[var(--t1-accent-cyan)] font-mono">{symbol}</span>
        <span
          ref={changeRef}
          className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded font-mono transition-colors duration-75',
            isPositive
              ? 'bg-[rgba(34,197,94,0.15)] text-[var(--t1-accent-green)]'
              : 'bg-[rgba(239,68,68,0.15)] text-[var(--t1-accent-red)]'
          )}
        >
          {isPositive ? '▲' : '▼'} {(isPositive ? '+' : '') + initialChangePercent.toFixed(2)}%
        </span>
      </div>
      <div className="flex items-end justify-between mt-2">
        <div>
          <div
            ref={valueRef}
            className="text-lg font-bold font-mono text-[var(--t1-text-primary)] group-hover:text-white transition-colors leading-none"
          >
            {initialValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          </div>
          <div className="text-[10px] text-[var(--t1-text-muted)] mt-1">{name}</div>
        </div>
        
        {/* Tiny Sparkline */}
        <div className="shrink-0 mb-1">
          <SparklineChart 
            data={history} 
            color={isPositive ? 'var(--t1-accent-green)' : 'var(--t1-accent-red)'} 
          />
        </div>
      </div>
      
      {/* HFT activity indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--t1-accent-green)] to-transparent opacity-0 group-hover:opacity-40 transition-opacity" />
    </div>
  );
});

// ===== HFT CURRENCY ROW =====
const HFTCurrencyRow = memo(function HFTCurrencyRow({ pair, initialRate, initialChangePercent }: {
  pair: string; initialRate: number; initialChangePercent: number;
}) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const changeRef = useRef<HTMLSpanElement>(null);
  const isPositive = initialChangePercent >= 0;

  useEffect(() => {
    return registerCurrencyRef(pair, {
      valueEl: valueRef.current,
      changeEl: changeRef.current,
      badgeEl: null,
      prevValue: initialRate,
    });
  }, [pair, initialRate]);

  return (
    <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-[var(--t1-bg-tertiary)] transition-colors cursor-pointer">
      <span className="text-xs font-mono font-medium text-[var(--t1-text-primary)]">{pair}</span>
      <div className="flex items-center gap-3">
        <span ref={valueRef} className="text-xs font-mono text-[var(--t1-text-secondary)]">{initialRate.toFixed(4)}</span>
        <span
          ref={changeRef}
          className={cn(
            'text-[10px] font-mono font-bold w-16 text-right transition-colors duration-75',
            isPositive ? 'text-[var(--t1-accent-green)]' : 'text-[var(--t1-accent-red)]'
          )}
        >
          {(isPositive ? '+' : '') + initialChangePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
});

// ===== HFT COMMODITY ROW =====
const HFTCommodityRow = memo(function HFTCommodityRow({ name, symbol, initialPrice, initialChangePercent, unit }: {
  name: string; symbol: string; initialPrice: number; initialChangePercent: number; unit: string;
}) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const changeRef = useRef<HTMLSpanElement>(null);
  
  // Local state for sparkline history
  const [history, setHistory] = useState<number[]>(() => Array(20).fill(initialPrice));
  const isPositive = initialChangePercent >= 0;

  useEffect(() => {
    return registerCommodityRef(symbol, {
      valueEl: valueRef.current,
      changeEl: changeRef.current,
      badgeEl: null,
      prevValue: initialPrice,
      onTick: (newVal: number) => setHistory(prev => [...prev.slice(1), newVal])
    });
  }, [symbol, initialPrice]);

  return (
    <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-[var(--t1-bg-tertiary)] transition-colors cursor-pointer group">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-[var(--t1-accent-amber)] font-mono w-6">{symbol}</span>
        <span className="text-xs text-[var(--t1-text-primary)]">{name}</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:block">
          <SparklineChart 
            data={history} 
            color={isPositive ? 'var(--t1-accent-green)' : 'var(--t1-accent-red)'} 
          />
        </div>
        <span ref={valueRef} className="text-xs font-mono text-[var(--t1-text-secondary)] w-14 text-right">
          ${initialPrice < 10 ? initialPrice.toFixed(3) : initialPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}{unit}
        </span>
        <span
          ref={changeRef}
          className={cn(
            'text-[10px] font-mono font-bold w-12 text-right transition-colors duration-75',
            isPositive ? 'text-[var(--t1-accent-green)]' : 'text-[var(--t1-accent-red)]'
          )}
        >
          {(isPositive ? '+' : '') + initialChangePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
});

export default function MarketOverview() {
  const [activeTab, setActiveTab] = useState<'SIGNALS' | 'INTEL_MAP'>('SIGNALS');
  
  // Aggregate mock region data from the commodity/currency buffers + fixed values for demo
  const mockRegionData = [
    { name: 'NA', count: 42 },
    { name: 'EMEA', count: 28 },
    { name: 'APAC', count: 35 },
    { name: 'LATAM', count: 12 },
  ];

  // Derive simple mock intel items for the Interlinkage Map
  // In a real app we'd pass these from a global store that holds the wire-engine state
  const mockItems: any[] = [
    { id: '1', category: 'GEOPOLITICS', source: 'T1 WIRE', urgency: 'FLASH', headline: 'Mock Geopolitics Flash', region: 'EMEA', storyline: 'Energy Blockade' },
    { id: '2', category: 'ENERGY', source: 'SIGINT', urgency: 'URGENT', headline: 'Oil spikes', storyline: 'Energy Blockade' },
    { id: '3', category: 'MARKETS', source: 'FININT', urgency: 'BULLETIN', headline: 'Markets react', storyline: 'Rate Cut' },
    { id: '4', category: 'ECONOMICS', source: 'GOVINT', urgency: 'URGENT', headline: 'Inflation prints low', storyline: 'Rate Cut' },
    { id: '5', category: 'TECH', source: 'OSINT', urgency: 'NORMAL', headline: 'New chip rules', region: 'APAC' },
    { id: '6', category: 'CYBER', source: 'SIGINT', urgency: 'FLASH', headline: 'Infrastructure attack', region: 'NA' },
    { id: '7', category: 'DEFENSE', source: 'GOVINT', urgency: 'NORMAL', headline: 'Defense spending hike', region: 'NA' },
  ];

  // Initial render only — HFT engine handles all subsequent updates via DOM refs
  return (
    <div className="flex flex-col h-full space-y-3 animate-fade-in-up">
      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-[var(--t1-border)] pb-2 px-1">
        <button 
          onClick={() => setActiveTab('SIGNALS')}
          className={cn(
            "text-[10px] sm:text-[11px] font-bold tracking-widest px-3 py-1 rounded transition-colors",
            activeTab === 'SIGNALS' 
              ? "bg-[var(--t1-accent-green)]/15 text-[var(--t1-accent-green)] border border-[var(--t1-accent-green)]/30" 
              : "text-[var(--t1-text-muted)] hover:text-[var(--t1-text-secondary)]"
          )}
        >
          MARKET SIGNALS
        </button>
        <button 
          onClick={() => setActiveTab('INTEL_MAP')}
          className={cn(
            "text-[10px] sm:text-[11px] font-bold tracking-widest px-3 py-1 rounded transition-colors",
            activeTab === 'INTEL_MAP' 
              ? "bg-[var(--t1-accent-cyan)]/15 text-[var(--t1-accent-cyan)] border border-[var(--t1-accent-cyan)]/30" 
              : "text-[var(--t1-text-muted)] hover:text-[var(--t1-text-secondary)]"
          )}
        >
          INTEL TOPOLOGY
        </button>
      </div>

      {activeTab === 'SIGNALS' ? (
        <div className="grid grid-cols-1 gap-2 flex-1 min-h-0 overflow-y-auto">
          {/* Indices Grid */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-1 h-1 rounded-full bg-[var(--t1-accent-green)] animate-pulse-glow" />
          <h3 className="text-[10px] font-bold tracking-widest text-[var(--t1-text-muted)]">GLOBAL INDICES</h3>
          <span className="text-[9px] text-[var(--t1-accent-green)] font-mono ml-auto">LIVE 10/s</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {indexBuffer.map(idx => (
            <HFTIndexCard
              key={idx.symbol}
              symbol={idx.symbol}
              name={idx.name}
              initialValue={idx.value}
              initialChange={idx.change}
              initialChangePercent={idx.changePercent}
            />
          ))}
        </div>
      </div>

      {/* Currencies & Commodities side by side */}
      <div className="grid grid-cols-2 gap-2">
        <div className="glass rounded-lg p-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-[10px] font-bold tracking-widest text-[var(--t1-text-muted)]">FOREIGN EXCHANGE</h3>
            <span className="text-[9px] text-[var(--t1-accent-green)] font-mono ml-auto">●</span>
          </div>
          <div className="space-y-0">
            {currencyBuffer.map(cur => (
              <HFTCurrencyRow
                key={cur.pair}
                pair={cur.pair}
                initialRate={cur.rate}
                initialChangePercent={cur.changePercent}
              />
            ))}
          </div>
        </div>

        <div className="glass rounded-lg p-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-[10px] font-bold tracking-widest text-[var(--t1-text-muted)]">COMMODITIES</h3>
            <span className="text-[9px] text-[var(--t1-accent-green)] font-mono ml-auto">●</span>
          </div>
          <div className="space-y-0">
            {commodityBuffer.map(com => (
              <HFTCommodityRow
                key={com.symbol}
                name={com.name}
                symbol={com.symbol}
                initialPrice={com.price}
                initialChangePercent={com.changePercent}
                unit={com.unit}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Market Sentiment Gauge */}
      <div>
        <FearGreedGauge />
      </div>
    </div>
  ) : (
    <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto w-full">
      <div className="w-full shrink-0 h-[350px]">
        <InterlinkageMap items={mockItems} />
      </div>
      <div className="flex-1 w-full min-h-[160px]">
        <RegionBarChart data={mockRegionData} />
      </div>
    </div>
  )}
  </div>
  );
}
