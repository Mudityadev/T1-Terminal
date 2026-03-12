/**
 * T1 Terminal — Mock Financial Data
 * Realistic market data for the MVP
 */

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  region: 'US' | 'EU' | 'ASIA';
}

export interface CurrencyPair {
  pair: string;
  rate: number;
  change: number;
  changePercent: number;
}

export interface Commodity {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sparkline: number[];
}

export interface NewsItem {
  id: string;
  timestamp: Date;
  headline: string;
  source: string;
  category: 'MARKETS' | 'POLITICS' | 'ECONOMICS' | 'GEOPOLITICS' | 'TECH' | 'ENERGY';
  urgency: 'FLASH' | 'URGENT' | 'NORMAL';
}

export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ===== INDICES =====
export const INDICES: MarketIndex[] = [
  { symbol: 'SPX', name: 'S&P 500', value: 5842.31, change: 23.47, changePercent: 0.40, region: 'US' },
  { symbol: 'NDX', name: 'NASDAQ 100', value: 20518.74, change: -45.12, changePercent: -0.22, region: 'US' },
  { symbol: 'DJI', name: 'DOW JONES', value: 43127.85, change: 156.32, changePercent: 0.36, region: 'US' },
  { symbol: 'RUT', name: 'RUSSELL 2K', value: 2084.53, change: -12.67, changePercent: -0.61, region: 'US' },
  { symbol: 'UKX', name: 'FTSE 100', value: 8274.15, change: 34.28, changePercent: 0.42, region: 'EU' },
  { symbol: 'DAX', name: 'DAX 40', value: 19847.62, change: 89.41, changePercent: 0.45, region: 'EU' },
  { symbol: 'NKY', name: 'NIKKEI 225', value: 38642.18, change: -182.35, changePercent: -0.47, region: 'ASIA' },
  { symbol: 'HSI', name: 'HANG SENG', value: 17284.93, change: 215.67, changePercent: 1.26, region: 'ASIA' },
];

// ===== CURRENCIES =====
export const CURRENCIES: CurrencyPair[] = [
  { pair: 'EUR/USD', rate: 1.0847, change: 0.0023, changePercent: 0.21 },
  { pair: 'GBP/USD', rate: 1.2714, change: -0.0018, changePercent: -0.14 },
  { pair: 'USD/JPY', rate: 149.82, change: 0.43, changePercent: 0.29 },
  { pair: 'USD/CHF', rate: 0.8834, change: -0.0012, changePercent: -0.14 },
  { pair: 'AUD/USD', rate: 0.6523, change: 0.0034, changePercent: 0.52 },
  { pair: 'USD/CAD', rate: 1.3642, change: 0.0015, changePercent: 0.11 },
];

// ===== COMMODITIES =====
export const COMMODITIES: Commodity[] = [
  { name: 'Gold', symbol: 'XAU', price: 2648.30, change: 12.40, changePercent: 0.47, unit: '/oz' },
  { name: 'Silver', symbol: 'XAG', price: 31.24, change: -0.18, changePercent: -0.57, unit: '/oz' },
  { name: 'Crude Oil', symbol: 'CL', price: 71.48, change: -1.23, changePercent: -1.69, unit: '/bbl' },
  { name: 'Natural Gas', symbol: 'NG', price: 3.142, change: 0.087, changePercent: 2.85, unit: '/MMBtu' },
  { name: 'Copper', symbol: 'HG', price: 4.2315, change: 0.0425, changePercent: 1.01, unit: '/lb' },
];

// ===== WATCHLIST =====
export const WATCHLIST: WatchlistItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 227.48, change: 2.14, changePercent: 0.95, volume: 52_340_000, marketCap: 3_480_000_000_000, sparkline: [] },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.82, change: -3.21, changePercent: -0.77, volume: 23_180_000, marketCap: 3_090_000_000_000, sparkline: [] },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 171.34, change: 1.87, changePercent: 1.10, volume: 18_920_000, marketCap: 2_120_000_000_000, sparkline: [] },
  { symbol: 'AMZN', name: 'Amazon.com', price: 198.67, change: -0.43, changePercent: -0.22, volume: 31_450_000, marketCap: 2_070_000_000_000, sparkline: [] },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 138.92, change: 5.67, changePercent: 4.25, volume: 142_800_000, marketCap: 3_410_000_000_000, sparkline: [] },
  { symbol: 'META', name: 'Meta Platforms', price: 582.14, change: 8.92, changePercent: 1.56, volume: 14_620_000, marketCap: 1_480_000_000_000, sparkline: [] },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.31, change: -7.84, changePercent: -3.06, volume: 87_230_000, marketCap: 792_000_000_000, sparkline: [] },
  { symbol: 'JPM', name: 'JPMorgan Chase', price: 214.56, change: 1.23, changePercent: 0.58, volume: 8_740_000, marketCap: 618_000_000_000, sparkline: [] },
  { symbol: 'V', name: 'Visa Inc.', price: 291.84, change: 0.67, changePercent: 0.23, volume: 5_320_000, marketCap: 567_000_000_000, sparkline: [] },
  { symbol: 'BRK.B', name: 'Berkshire Hath.', price: 453.21, change: 2.87, changePercent: 0.64, volume: 3_120_000, marketCap: 875_000_000_000, sparkline: [] },
];

// ===== NEWS FEED =====
export const NEWS_FEED: Omit<NewsItem, 'id' | 'timestamp'>[] = [
  { headline: 'Federal Reserve signals potential rate hold through Q2 amid sticky inflation data', source: 'T1 WIRE', category: 'ECONOMICS', urgency: 'URGENT' },
  { headline: 'NVIDIA surpasses revenue expectations, AI chip demand continues to surge', source: 'T1 WIRE', category: 'TECH', urgency: 'FLASH' },
  { headline: 'European Central Bank members divided on pace of monetary easing', source: 'T1 WIRE', category: 'ECONOMICS', urgency: 'NORMAL' },
  { headline: 'US Treasury yields rise to 4.35% as investors reassess rate cut expectations', source: 'T1 WIRE', category: 'MARKETS', urgency: 'URGENT' },
  { headline: 'G7 leaders agree on expanded sanctions package targeting energy exports', source: 'T1 WIRE', category: 'GEOPOLITICS', urgency: 'FLASH' },
  { headline: 'China manufacturing PMI contracts for third consecutive month', source: 'T1 WIRE', category: 'ECONOMICS', urgency: 'URGENT' },
  { headline: 'Gold prices hit new record high amid geopolitical tensions and dollar weakness', source: 'T1 WIRE', category: 'MARKETS', urgency: 'FLASH' },
  { headline: 'Bank of Japan maintains ultra-loose monetary policy, yen weakens further', source: 'T1 WIRE', category: 'ECONOMICS', urgency: 'NORMAL' },
  { headline: 'OPEC+ extends production cuts through end of year, oil prices stable', source: 'T1 WIRE', category: 'ENERGY', urgency: 'URGENT' },
  { headline: 'US nonfarm payrolls beat expectations at 275K, unemployment steady at 3.7%', source: 'T1 WIRE', category: 'ECONOMICS', urgency: 'FLASH' },
  { headline: 'Apple announces largest-ever share buyback program worth $110 billion', source: 'T1 WIRE', category: 'MARKETS', urgency: 'NORMAL' },
  { headline: 'EU proposes new digital markets regulation targeting US tech giants', source: 'T1 WIRE', category: 'POLITICS', urgency: 'NORMAL' },
  { headline: 'Copper futures surge on supply disruptions from Chilean mining operations', source: 'T1 WIRE', category: 'MARKETS', urgency: 'URGENT' },
  { headline: 'India GDP growth accelerates to 8.2%, fastest among major economies', source: 'T1 WIRE', category: 'ECONOMICS', urgency: 'NORMAL' },
  { headline: 'Middle East tensions escalate: crude oil spikes 3% on shipping lane concerns', source: 'T1 WIRE', category: 'GEOPOLITICS', urgency: 'FLASH' },
];

// ===== CHART DATA GENERATOR =====
export function generateCandlestickData(days = 180): CandlestickData[] {
  const data: CandlestickData[] = [];
  let basePrice = 180 + Math.random() * 40;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const volatility = basePrice * 0.02;
    const open = basePrice + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.48) * volatility * 1.5;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(20_000_000 + Math.random() * 80_000_000);

    data.push({
      time: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    basePrice = close;
  }

  return data;
}
