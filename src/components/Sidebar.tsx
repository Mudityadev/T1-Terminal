'use client';

import { useState, useEffect, memo, useRef, useCallback } from 'react';
import { useMarketStore } from '@/store/market-store';
import { cn } from '@/lib/utils';
import {
  watchlistBuffer,
  registerWatchlistRef,
} from '@/lib/hft-engine';
import {
  LayoutDashboard, TrendingUp, Newspaper, Briefcase, Globe2,
  BarChart3, Shield, Settings, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { fireUnderConstruction } from '@/components/UnderConstructionToast';


const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: TrendingUp, label: 'Markets', active: false },
  { icon: Newspaper, label: 'News', active: false },
  { icon: Briefcase, label: 'Portfolio', active: false },
  { icon: Globe2, label: 'FX & Rates', active: false },
  { icon: BarChart3, label: 'Analytics', active: false },
  { icon: Shield, label: 'Risk', active: false },
];

// ===== HFT WATCHLIST ITEM =====
const HFTWatchlistItem = memo(function HFTWatchlistItem({
  symbol, name, initialPrice, initialChange, initialChangePercent, collapsed
}: {
  symbol: string; name: string; initialPrice: number; initialChange: number;
  initialChangePercent: number; collapsed: boolean;
}) {
  const valueRef = useRef<HTMLDivElement>(null);
  const changeRef = useRef<HTMLDivElement>(null);
  const { selectedSymbol, setSelectedSymbol } = useMarketStore();

  useEffect(() => {
    registerWatchlistRef(symbol, {
      valueEl: valueRef.current,
      changeEl: changeRef.current,
      badgeEl: null,
      prevValue: initialPrice,
    });
  }, [symbol, initialPrice]);

  const isPositive = initialChange >= 0;
  const isSelected = selectedSymbol === symbol;

  if (collapsed) {
    return (
      <button
        onClick={() => setSelectedSymbol(symbol)}
        title={`${symbol} — ${name}`}
        className={cn(
          'w-full flex items-center justify-center py-1.5 rounded transition-all duration-200',
          isSelected
            ? 'bg-[var(--t1-bg-tertiary)] border border-[var(--t1-border-glow)]'
            : 'hover:bg-[var(--t1-bg-tertiary)] border border-transparent'
        )}
      >
        <span className={cn(
          'text-[10px] font-bold font-mono',
          isSelected ? 'text-[var(--t1-accent-cyan)]' : 'text-[var(--t1-text-secondary)]'
        )}>
          {symbol.slice(0, 4)}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setSelectedSymbol(symbol)}
      className={cn(
        'w-full flex items-center justify-between px-2 py-1 rounded transition-all duration-150 text-left group',
        isSelected
          ? 'bg-[var(--t1-bg-tertiary)] border border-[var(--t1-border-glow)]'
          : 'hover:bg-[var(--t1-bg-tertiary)] border border-transparent'
      )}
    >
      <div className="min-w-0">
        <span className={cn(
          'text-[11px] font-bold font-mono',
          isSelected ? 'text-[var(--t1-accent-cyan)]' : 'text-[var(--t1-text-primary)]'
        )}>
          {symbol}
        </span>
        <div className="text-[9px] text-[var(--t1-text-muted)] truncate">{name}</div>
      </div>
      <div className="text-right shrink-0 ml-1">
        <div ref={valueRef} className="text-[11px] font-mono text-[var(--t1-text-primary)]">
          ${initialPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        </div>
        <div
          ref={changeRef}
          className={cn(
            'text-[10px] font-mono transition-colors duration-75',
            isPositive ? 'text-[var(--t1-accent-green)]' : 'text-[var(--t1-accent-red)]'
          )}
        >
          {(isPositive ? '+' : '') + initialChangePercent.toFixed(2)}%
        </div>
      </div>
    </button>
  );
});

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { selectedSymbol } = useMarketStore();

  // Keyboard shortcut: Ctrl+B to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        onToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);

  return (
    <aside
      className={cn(
        'flex flex-col glass border-r border-[var(--t1-border)] h-full overflow-hidden transition-all duration-300 ease-in-out',
        collapsed ? 'w-12' : 'w-52'
      )}
    >
      {/* Collapse Toggle */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[var(--t1-border)]">
        {!collapsed && (
          <span className="text-[9px] font-bold tracking-widest text-[var(--t1-text-muted)]">NAVIGATION</span>
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-[var(--t1-bg-tertiary)] text-[var(--t1-text-muted)] hover:text-[var(--t1-text-primary)] transition-colors ml-auto"
          title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
        >
          {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-1 border-b border-[var(--t1-border)]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              title={collapsed ? item.label : undefined}
              onClick={() => { if (!item.active) fireUnderConstruction(item.label); }}
              className={cn(
                'w-full flex items-center rounded text-xs transition-all duration-200',
                collapsed ? 'justify-center px-1 py-1.5' : 'gap-2.5 px-2.5 py-1.5',
                item.active
                  ? 'bg-[var(--t1-bg-tertiary)] text-[var(--t1-accent-green)] border border-[var(--t1-border-glow)]'
                  : 'text-[var(--t1-text-secondary)] hover:text-[var(--t1-text-primary)] hover:bg-[var(--t1-bg-tertiary)] border border-transparent'
              )}
            >
              <Icon size={collapsed ? 16 : 14} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Watchlist */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn(
          'py-1.5 border-b border-[var(--t1-border)]',
          collapsed ? 'px-1 text-center' : 'px-3'
        )}>
          <h3 className="text-[9px] font-bold tracking-widest text-[var(--t1-text-muted)]">
            {collapsed ? 'WL' : 'WATCHLIST'}
          </h3>
        </div>
        <div className="p-0.5">
          {watchlistBuffer.map((item) => (
            <HFTWatchlistItem
              key={item.symbol}
              symbol={item.symbol}
              name={item.name}
              initialPrice={item.price}
              initialChange={item.change}
              initialChangePercent={item.changePercent}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      {/* Bottom Settings */}
      <div className="p-1 border-t border-[var(--t1-border)]">
        <button
          title={collapsed ? 'Settings' : undefined}
          className={cn(
            'w-full flex items-center rounded text-xs text-[var(--t1-text-muted)] hover:text-[var(--t1-text-primary)] hover:bg-[var(--t1-bg-tertiary)] transition-colors',
            collapsed ? 'justify-center px-1 py-1.5' : 'gap-2.5 px-2.5 py-1.5'
          )}
        >
          <Settings size={14} />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}
