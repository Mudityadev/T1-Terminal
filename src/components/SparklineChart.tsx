'use client';

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineChartProps {
  data: number[];
  color: string;
}

export default function SparklineChart({ data, color }: SparklineChartProps) {
  // Convert flat number array into object array for Recharts
  const chartData = data.map((val, i) => ({ value: val, index: i }));

  // Find dynamic min/max to ensure the line utilizes the full height of the container
  const min = Math.min(...data);
  const max = Math.max(...data);
  const domain = [min - (max - min) * 0.1, max + (max - min) * 0.1];

  return (
    <div className="w-16 h-8 opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={domain} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false} // Disable built-in animation to avoid jitter on fast HFT updates
            style={{ filter: `drop-shadow(0 0 2px ${color}80)` }} // Subtle glow
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
