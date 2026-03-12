'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMarketStore } from '@/store/market-store';
import { generateCandlestickData } from '@/data/mock-data';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y', '5Y'];
const CHART_TYPES = ['Candlestick', 'Line', 'Area'] as const;

export default function PriceChart() {
  const { selectedSymbol, watchlist } = useMarketStore();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof import('lightweight-charts').createChart> | null>(null);
  const seriesRef = useRef<unknown>(null);
  const volumeSeriesRef = useRef<unknown>(null);
  const [activeTimeframe, setActiveTimeframe] = useState('1Y');
  const [activeChartType, setActiveChartType] = useState<typeof CHART_TYPES[number]>('Candlestick');
  const [chartReady, setChartReady] = useState(false);

  const selectedStock = watchlist.find(w => w.symbol === selectedSymbol) || watchlist[0];

  const initChart = useCallback(async () => {
    if (!chartContainerRef.current) return;
    
    const { createChart, ColorType, CrosshairMode } = await import('lightweight-charts');

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(55, 65, 81, 0.3)' },
        horzLines: { color: 'rgba(55, 65, 81, 0.3)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(34, 197, 94, 0.4)', width: 1, style: 2 },
        horzLine: { color: 'rgba(34, 197, 94, 0.4)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(55, 65, 81, 0.5)',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: 'rgba(55, 65, 81, 0.5)',
        timeVisible: false,
      },
    });

    chartRef.current = chart;

    const data = generateCandlestickData(
      activeTimeframe === '1D' ? 1 :
      activeTimeframe === '1W' ? 7 :
      activeTimeframe === '1M' ? 30 :
      activeTimeframe === '3M' ? 90 :
      activeTimeframe === '1Y' ? 365 : 1825
    );

    // Volume series
    const volumeSeries = chart.addHistogramSeries({
      color: 'rgba(59, 130, 246, 0.2)',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeries.setData(
      data.map(d => ({ time: d.time, value: d.volume, color: d.close >= d.open ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }))
    );
    volumeSeriesRef.current = volumeSeries;

    // Main series
    if (activeChartType === 'Candlestick') {
      const series = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
      series.setData(data);
      seriesRef.current = series;
    } else if (activeChartType === 'Line') {
      const series = chart.addLineSeries({
        color: '#22c55e',
        lineWidth: 2,
      });
      series.setData(data.map(d => ({ time: d.time, value: d.close })));
      seriesRef.current = series;
    } else {
      const series = chart.addAreaSeries({
        topColor: 'rgba(34, 197, 94, 0.4)',
        bottomColor: 'rgba(34, 197, 94, 0.0)',
        lineColor: '#22c55e',
        lineWidth: 2,
      });
      series.setData(data.map(d => ({ time: d.time, value: d.close })));
      seriesRef.current = series;
    }

    chart.timeScale().fitContent();
    setChartReady(true);

    // Resize observer
    const observer = new ResizeObserver(() => {
      if (chartRef.current && container) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [activeTimeframe, activeChartType]);

  useEffect(() => {
    initChart();
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart, selectedSymbol]);

  return (
    <div className="glass rounded-lg flex flex-col h-full overflow-hidden animate-fade-in-up">
      {/* Chart Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--t1-border)]">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--t1-accent-cyan)] font-mono">{selectedStock.symbol}</span>
              <span className="text-xs text-[var(--t1-text-muted)]">{selectedStock.name}</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xl font-bold font-mono">{formatCurrency(selectedStock.price)}</span>
              <span className={cn(
                'text-sm font-bold font-mono',
                selectedStock.change >= 0 ? 'text-[var(--t1-accent-green)]' : 'text-[var(--t1-accent-red)]'
              )}>
                {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} ({formatPercent(selectedStock.changePercent)})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Chart Type Selector */}
          <div className="flex items-center gap-1 bg-[var(--t1-bg-primary)] rounded p-0.5">
            {CHART_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setActiveChartType(type)}
                className={cn(
                  'px-2 py-1 text-[10px] rounded transition-all font-mono',
                  activeChartType === type
                    ? 'bg-[var(--t1-bg-tertiary)] text-[var(--t1-accent-green)] border border-[var(--t1-border-glow)]'
                    : 'text-[var(--t1-text-muted)] hover:text-[var(--t1-text-secondary)]'
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-[var(--t1-bg-primary)] rounded p-0.5">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={cn(
                  'px-2 py-1 text-[10px] rounded transition-all font-mono',
                  activeTimeframe === tf
                    ? 'bg-[var(--t1-bg-tertiary)] text-[var(--t1-accent-green)] border border-[var(--t1-border-glow)]'
                    : 'text-[var(--t1-text-muted)] hover:text-[var(--t1-text-secondary)]'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="flex-1 relative min-h-0">
        {!chartReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs text-[var(--t1-text-muted)] font-mono animate-pulse-glow">Loading chart...</div>
          </div>
        )}
      </div>
    </div>
  );
}
