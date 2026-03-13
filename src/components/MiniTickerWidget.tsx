'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { registerCommodityRef, registerIndexRef, registerCurrencyRef } from '@/lib/hft-engine';
import SparklineChart from './SparklineChart';

type TickerType = 'INDEX' | 'COMMODITY' | 'CURRENCY';

interface MiniTickerWidgetProps {
  symbol: string;
  type: TickerType;
  initialValue: number;
  initialChangePercent: number;
}

export const MiniTickerWidget = memo(function MiniTickerWidget({ 
  symbol, type, initialValue, initialChangePercent 
}: MiniTickerWidgetProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const changeRef = useRef<HTMLSpanElement>(null);
  
  // Track history for the sparkline
  const [history, setHistory] = useState<number[]>(() => Array(20).fill(initialValue));
  const isPositive = initialChangePercent >= 0;

  useEffect(() => {
    let unregister: () => void = () => {};

    const entry = {
      valueEl: valueRef.current,
      changeEl: changeRef.current,
      badgeEl: null,
      prevValue: initialValue,
      onTick: (newVal: number) => setHistory(prev => [...prev.slice(1), newVal])
    };

    if (type === 'INDEX') unregister = registerIndexRef(symbol, entry);
    else if (type === 'COMMODITY') unregister = registerCommodityRef(symbol, entry);
    else if (type === 'CURRENCY') unregister = registerCurrencyRef(symbol, entry);

    // Cleanup on unmount so the Set doesn't leak memory if news items are removed
    return () => unregister();
  }, [symbol, type, initialValue]);

  return (
    <div className="flex items-center gap-2 px-1.5 py-1 rounded bg-[var(--t1-bg-primary)] border border-[var(--t1-border)]/50 shrink-0 shadow-sm shadow-black/20">
      <div className="flex flex-col">
        <span className="text-[9px] font-bold text-[var(--t1-text-muted)] tracking-wider">{symbol}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span 
            ref={valueRef} 
            className="text-xs font-mono font-bold text-[var(--t1-text-primary)]"
          >
            {type === 'COMMODITY' ? '$' : ''}{initialValue.toFixed(2)}
          </span>
          <span 
            ref={changeRef} 
            className={cn(
              "text-[9px] font-mono font-bold",
              isPositive ? 'text-[var(--t1-accent-green)]' : 'text-[var(--t1-accent-red)]'
            )}
          >
            {isPositive ? '+' : ''}{initialChangePercent.toFixed(2)}%
          </span>
        </div>
      </div>
      
      <div className="w-12 h-6 border-l border-[var(--t1-border)]/30 pl-1.5 ml-0.5 pointer-events-none">
        <SparklineChart 
          data={history} 
          color={isPositive ? 'var(--t1-accent-green)' : 'var(--t1-accent-red)'} 
        />
      </div>
    </div>
  );
});
