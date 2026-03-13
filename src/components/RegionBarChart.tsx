'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RegionData {
  name: string;
  count: number;
}

export default function RegionBarChart({ data }: { data: RegionData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center border border-[var(--t1-border)] rounded-lg glass p-4">
        <p className="text-[10px] text-[var(--t1-text-muted)] font-mono">NO REGION DATA</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-lg border border-[var(--t1-border)] p-4 flex flex-col h-full w-full">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-[10px] font-bold tracking-widest text-[var(--t1-text-muted)]">INTEL REGION FOCUS</h3>
        <span className="text-[9px] text-[var(--t1-accent-cyan)] font-mono ml-auto">LIVE</span>
      </div>
      
      <div className="flex-1 min-h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--t1-border)" vertical={false} opacity={0.5} />
            <XAxis
              dataKey="name"
              stroke="var(--t1-text-muted)"
              fontSize={9}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--t1-text-muted)"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--t1-bg-tertiary)', opacity: 0.4 }}
              contentStyle={{
                backgroundColor: 'var(--t1-bg-card)',
                borderColor: 'var(--t1-border)',
                borderRadius: '6px',
                padding: '4px 8px',
              }}
              itemStyle={{ color: 'var(--t1-accent-cyan)', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}
              labelStyle={{ color: 'var(--t1-text-muted)', fontSize: '10px', marginBottom: '2px' }}
            />
            <Bar 
              dataKey="count" 
              name="Events" 
              radius={[4, 4, 0, 0]} 
              fill="var(--t1-accent-cyan)" 
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
