/**
 * T1 Terminal — Zustand Market Store
 * Central state management for all market data
 */
import { create } from 'zustand';
import {
  INDICES, CURRENCIES, COMMODITIES, WATCHLIST, NEWS_FEED,
  type MarketIndex, type CurrencyPair, type Commodity,
  type WatchlistItem, type NewsItem
} from '@/data/mock-data';
import { generateSparklineData, randomBetween } from '@/lib/utils';

interface MarketState {
  indices: MarketIndex[];
  currencies: CurrencyPair[];
  commodities: Commodity[];
  watchlist: WatchlistItem[];
  news: NewsItem[];
  selectedSymbol: string;
  commandBarOpen: boolean;
  isConnected: boolean;

  setSelectedSymbol: (symbol: string) => void;
  toggleCommandBar: () => void;
  tick: () => void;
  addNewsItem: () => void;
}

let newsCounter = 0;

export const useMarketStore = create<MarketState>((set, get) => ({
  indices: INDICES,
  currencies: CURRENCIES,
  commodities: COMMODITIES,
  watchlist: WATCHLIST.map(item => ({ ...item, sparkline: generateSparklineData() })),
  news: [],
  selectedSymbol: 'AAPL',
  commandBarOpen: false,
  isConnected: true,

  setSelectedSymbol: (symbol: string) => set({ selectedSymbol: symbol }),

  toggleCommandBar: () => set(state => ({ commandBarOpen: !state.commandBarOpen })),

  tick: () => set(state => {
    // Simulate price ticks for indices
    const indices = state.indices.map(idx => {
      const delta = randomBetween(-0.15, 0.15) * (idx.value / 1000);
      const newValue = idx.value + delta;
      const newChange = idx.change + delta;
      const newChangePercent = (newChange / (newValue - newChange)) * 100;
      return { ...idx, value: newValue, change: newChange, changePercent: newChangePercent };
    });

    // Simulate price ticks for currencies
    const currencies = state.currencies.map(cur => {
      const delta = randomBetween(-0.0005, 0.0005);
      const newRate = cur.rate + delta;
      const newChange = cur.change + delta;
      const newChangePercent = (newChange / (newRate - newChange)) * 100;
      return { ...cur, rate: newRate, change: newChange, changePercent: newChangePercent };
    });

    // Simulate price ticks for commodities
    const commodities = state.commodities.map(com => {
      const delta = randomBetween(-0.1, 0.1) * (com.price / 100);
      const newPrice = com.price + delta;
      const newChange = com.change + delta;
      const newChangePercent = (newChange / (newPrice - newChange)) * 100;
      return { ...com, price: newPrice, change: newChange, changePercent: newChangePercent };
    });

    // Simulate watchlist ticks
    const watchlist = state.watchlist.map(item => {
      const delta = randomBetween(-0.3, 0.3);
      const newPrice = item.price + delta;
      const newChange = item.change + delta;
      const newChangePercent = (newChange / (newPrice - newChange)) * 100;
      const sparkline = [...item.sparkline.slice(1), newPrice];
      return { ...item, price: newPrice, change: newChange, changePercent: newChangePercent, sparkline };
    });

    return { indices, currencies, commodities, watchlist };
  }),

  addNewsItem: () => set(state => {
    const template = NEWS_FEED[newsCounter % NEWS_FEED.length];
    newsCounter++;
    const newsItem: NewsItem = {
      ...template,
      id: `news-${Date.now()}-${newsCounter}`,
      timestamp: new Date(),
    };
    return { news: [newsItem, ...state.news].slice(0, 50) };
  }),
}));
