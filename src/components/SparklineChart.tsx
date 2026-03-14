'use client';

import { LineChart, Line, YAxis } from 'recharts';

interface SparklineChartProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

export default function SparklineChart({ data, color, width = 60, height = 30 }: SparklineChartProps) {
  // Guard: need at least 2 points to draw a line
  if (!data || data.length < 2) return null;

  // Convert flat number array into object array for Recharts
  const chartData = data.map((val, i) => ({ value: val, index: i }));

  // Find dynamic min/max to ensure the line utilizes the full height of the container
  const min = Math.min(...data);
  const max = Math.max(...data);
  const padding = (max - min) * 0.1 || 1;
  const domain: [number, number] = [min - padding, max + padding];

  return (
    <div className="opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ width, height }}>
      <LineChart width={width} height={height} data={chartData}>
        <YAxis domain={domain} hide />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
          style={{ filter: `drop-shadow(0 0 2px ${color}80)` }}
        />
      </LineChart>
    </div>
  );
}
