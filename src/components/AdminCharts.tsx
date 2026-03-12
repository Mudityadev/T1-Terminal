'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
} from 'recharts';

export function TrafficChart({ data }: { data: any[] }) {
  if (!data || data.length === 0)
    return (
      <div className="h-64 flex items-center justify-center border border-[var(--t1-border)] rounded-xl glass">
        <p className="text-xs text-[var(--t1-text-muted)] font-mono">No traffic data available</p>
      </div>
    );

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--t1-border)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="var(--t1-text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--t1-text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(5, 5, 5, 0.9)',
              borderColor: 'var(--t1-border)',
              borderRadius: '8px',
            }}
            itemStyle={{ color: '#fff', fontSize: '12px' }}
            labelStyle={{
              color: 'var(--t1-text-muted)',
              fontSize: '10px',
              marginBottom: '4px',
            }}
          />
          <Area
            type="monotone"
            dataKey="pageViews"
            stroke="#06b6d4"
            fillOpacity={1}
            fill="url(#colorViews)"
          />
          <Area
            type="monotone"
            dataKey="visits"
            stroke="#22c55e"
            fillOpacity={1}
            fill="url(#colorVisits)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBarChart({ data }: { data: { name: string; count: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center border border-[var(--t1-border)] rounded-xl glass">
        <p className="text-xs text-[var(--t1-text-muted)] font-mono">No category data available</p>
      </div>
    );
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--t1-border)" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="var(--t1-text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--t1-text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(5, 5, 5, 0.9)',
              borderColor: 'var(--t1-border)',
              borderRadius: '8px',
            }}
            itemStyle={{ color: '#fff', fontSize: 12 }}
            labelStyle={{
              color: 'var(--t1-text-muted)',
              fontSize: 10,
              marginBottom: 4,
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FeedbackSparkline({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center border border-[var(--t1-border)] rounded-xl glass">
        <p className="text-[10px] text-[var(--t1-text-muted)] font-mono">No feedback activity</p>
      </div>
    );
  }

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorFeedback" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
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
            contentStyle={{
              backgroundColor: 'rgba(5, 5, 5, 0.9)',
              borderColor: 'var(--t1-border)',
              borderRadius: '8px',
            }}
            itemStyle={{ color: '#fff', fontSize: 12 }}
            labelStyle={{
              color: 'var(--t1-text-muted)',
              fontSize: 10,
              marginBottom: 4,
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#f59e0b"
            fillOpacity={1}
            fill="url(#colorFeedback)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
