'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useMarketStore } from '@/store/market-store';
import {
  indexBuffer, currencyBuffer, commodityBuffer,
  registerIndexRef, registerCurrencyRef, registerCommodityRef,
} from '@/lib/hft-engine';
import { cn } from '@/lib/utils';

// ===== HFT INDEX CARD (registers DOM refs, never re-renders after mount) =====
const HFTIndexCard = memo(function HFTIndexCard({ symbol, name, initialValue, initialChange, initialChangePercent }: {
  symbol: string; name: string; initialValue: number; initialChange: number; initialChangePercent: number;
}) {
  const valueRef = useRef<HTMLDivElement>(null);
  const changeRef = useRef<HTMLSpanElement>(null);
  const isPositive = initialChange >= 0;

  useEffect(() => {
    registerIndexRef(symbol, {
      valueEl: valueRef.current,
      changeEl: changeRef.current,
      badgeEl: null,
      prevValue: initialValue,
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
      <div
        ref={valueRef}
        className="text-lg font-bold font-mono text-[var(--t1-text-primary)] group-hover:text-white transition-colors"
      >
        {initialValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      </div>
      <div className="text-[10px] text-[var(--t1-text-muted)] mt-0.5">{name}</div>
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
    registerCurrencyRef(pair, {
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
  const isPositive = initialChangePercent >= 0;

  useEffect(() => {
    registerCommodityRef(symbol, {
      valueEl: valueRef.current,
      changeEl: changeRef.current,
      badgeEl: null,
      prevValue: initialPrice,
    });
  }, [symbol, initialPrice]);

  return (
    <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-[var(--t1-bg-tertiary)] transition-colors cursor-pointer">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-[var(--t1-accent-amber)] font-mono w-6">{symbol}</span>
        <span className="text-xs text-[var(--t1-text-primary)]">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span ref={valueRef} className="text-xs font-mono text-[var(--t1-text-secondary)]">
          ${initialPrice < 10 ? initialPrice.toFixed(3) : initialPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}{unit}
        </span>
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

export default function MarketOverview() {
  // Initial render only — HFT engine handles all subsequent updates via DOM refs
  return (
    <div className="grid grid-cols-1 gap-2 animate-fade-in-up">
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
    </div>
  );
}
