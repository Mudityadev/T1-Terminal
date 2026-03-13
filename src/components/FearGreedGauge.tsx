'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Custom Gauge implementation using Recharts Pie chart
export default function FearGreedGauge() {
  const [value, setValue] = useState(50); // Initial neutral value

  useEffect(() => {
    // Simulate slight fluctuations in fear & greed
    const iv = setInterval(() => {
      setValue(prev => {
        const diff = (Math.random() - 0.5) * 8;
        return Math.max(10, Math.min(90, prev + diff));
      });
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  // Use 180 as total for a semi-circle gauge
  const data = [
    { name: 'Extreme Fear', value: 36, color: 'rgba(239,68,68,0.8)' }, // Red
    { name: 'Fear', value: 36, color: 'rgba(245,158,11,0.8)' }, // Amber
    { name: 'Neutral', value: 36, color: 'rgba(107,114,128,0.8)' }, // Gray
    { name: 'Greed', value: 36, color: 'rgba(132,204,22,0.8)' }, // Lime
    { name: 'Extreme Greed', value: 36, color: 'rgba(34,197,94,0.8)' }, // Green
  ];

  // Calculate needle rotation based on 0-100 value
  const rotation = -90 + (value / 100) * 180;

  // Determine label category
  const getCategory = (val: number) => {
    if (val <= 20) return { label: 'EXTREME FEAR', color: 'text-red-500' };
    if (val <= 40) return { label: 'FEAR', color: 'text-amber-500' };
    if (val <= 60) return { label: 'NEUTRAL', color: 'text-gray-400' };
    if (val <= 80) return { label: 'GREED', color: 'text-lime-500' };
    return { label: 'EXTREME GREED', color: 'text-green-500' };
  };

  const cat = getCategory(value);

  return (
    <div className="glass rounded-lg border border-[var(--t1-border)] flex flex-col items-center justify-center p-4 relative overflow-hidden group">
      <div className="flex items-center justify-between w-full mb-2">
        <h3 className="text-[10px] font-bold tracking-widest text-[var(--t1-text-muted)]">MARKET SENTIMENT</h3>
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--t1-text-muted)] animate-pulse-glow" />
      </div>

      <div className="relative w-full h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
              stroke="none"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 w-[2px] h-[75px] bg-white origin-bottom rounded-t-full transition-transform duration-700 ease-out z-10 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white z-20 border-2 border-[var(--t1-bg-primary)] shadow-xl" />
        
        {/* Value Label */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center z-30">
          <span className="text-xl font-bold font-mono text-white tracking-tighter drop-shadow-md">
            {Math.round(value)}
          </span>
        </div>
      </div>

      <div className={cn("mt-4 text-[12px] font-black tracking-widest uppercase transition-colors duration-500 text-shadow-sm", cat.color)}>
        {cat.label}
      </div>
      
      {/* Background glow overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[var(--t1-bg-secondary)]/50 to-transparent pointer-events-none" />
    </div>
  );
}
