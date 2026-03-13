import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns a random float between min (inclusive) and max (exclusive) */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Generates a sparkline array of `n` price-like data points */
export function generateSparklineData(n = 20, base = 100): number[] {
  const data: number[] = [base];
  for (let i = 1; i < n; i++) {
    const prev = data[i - 1];
    data.push(Math.max(0, prev + randomBetween(-2, 2)));
  }
  return data;
}

/** Format a number as a currency string (USD by default) */
export function formatCurrency(value: number, currency = 'USD', decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Format a number as a percentage string */
export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

