'use client';

import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { IntelItem } from '@/lib/wire-engine';

interface NewsItemChartProps {
  item: IntelItem;
}

// Generate static deterministic data based on the item ID so charts dont jitter on re-render
const getDeterministicRandom = (id: string, index: number, max: number) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = Math.imul(31, hash) + id.charCodeAt(i) | 0;
  const seededRandom = Math.abs((Math.sin(hash + index) * 10000) % 1);
  return seededRandom * max;
};

// Custom tooltip component for sleek terminal aesthetic
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--t1-bg-primary)] border border-[var(--t1-border-glow)] rounded p-1.5 shadow-lg shadow-black/40">
        <p className="text-[10px] font-mono text-[var(--t1-text-primary)]">{payload[0].name || payload[0].payload.name}</p>
        <p className="text-[10px] font-mono font-bold" style={{ color: payload[0].color || payload[0].payload.fill }}>
          {payload[0].value.toFixed(1)}
        </p>
      </div>
    );
  }
  return null;
};

export function NewsItemChart({ item }: NewsItemChartProps) {
  
  const renderLineChart = () => {
    // Generate a trend line that feels related to markets
    const data = useMemo(() => {
      const start = getDeterministicRandom(item.id, 0, 100) + 100;
      let current = start;
      return Array.from({ length: 15 }).map((_, i) => {
        current += (getDeterministicRandom(item.id, i, 10) - 5);
        return { name: `T-${15 - i}`, value: current };
      });
    }, [item.id]);

    const isPositive = data[data.length - 1].value >= data[0].value;
    const color = isPositive ? 'var(--t1-accent-green)' : 'var(--t1-accent-red)';

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--t1-border)', strokeWidth: 1, strokeDasharray: '2 2' }} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={1.5}
            fillOpacity={1} 
            fill={`url(#grad-${item.id})`} 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="h-28 w-full bg-[var(--t1-bg-secondary)]/30 border border-[var(--t1-border)]/50 rounded-lg p-2 relative overflow-hidden group">
      {/* Render selected chart */}
      <div className="w-full h-full pt-4">
        {renderLineChart()}
      </div>
    </div>
  );
}
