/**
 * T1 Terminal — Live Feed API Route
 * 
 * Aggregates real-time news from:
 * - RSS feeds: Reuters, CNBC, BBC World, AP, Al Jazeera, Financial Times
 * - GDELT Project: Global geopolitical event database
 * 
 * Server-side only (no CORS issues). Cached for 60s.
 */

import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

// ===== TYPES =====
interface FeedItem {
  headline: string;
  source: string;
  category: string;
  urgency: string;
  timestamp: number;
  link?: string;
  region?: string;
}

// ===== RSS FEED SOURCES =====
const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC', defaultCategory: 'GEOPOLITICS' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC', defaultCategory: 'ECONOMICS' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', source: 'BBC', defaultCategory: 'TECH' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'NYT', defaultCategory: 'GEOPOLITICS' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', source: 'NYT', defaultCategory: 'ECONOMICS' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', source: 'NYT', defaultCategory: 'TECH' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'AL JAZEERA', defaultCategory: 'GEOPOLITICS' },
  { url: 'https://feeds.skynews.com/feeds/rss/world.xml', source: 'SKY NEWS', defaultCategory: 'GEOPOLITICS' },
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', source: 'CNBC', defaultCategory: 'MARKETS' },
  { url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html', source: 'CNBC', defaultCategory: 'ECONOMICS' },
  { url: 'https://feeds.a]reuters.com/reuters/topNews', source: 'REUTERS', defaultCategory: 'GEOPOLITICS' },
  { url: 'https://feeds.a]reuters.com/reuters/businessNews', source: 'REUTERS', defaultCategory: 'MARKETS' },
  // High-signal official macro/central-bank sources
  { url: 'https://www.federalreserve.gov/feeds/press_all.xml', source: 'FED', defaultCategory: 'ECONOMICS' },
  { url: 'https://www.ecb.europa.eu/press/pr/rss/en.rss', source: 'ECB', defaultCategory: 'ECONOMICS' },
  { url: 'https://www.bankofengland.co.uk/boeapps/iadb/RSS/NewsReleasesAll.xml', source: 'BOE', defaultCategory: 'ECONOMICS' },
];

// ===== KEYWORD-BASED CATEGORIZATION =====
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // POLITICS must come before GEOPOLITICS — Object.entries preserves insertion order
  // and the loop returns on first match, so domestic politics must win over geopolitics
  POLITICS: [
    'election', 'congress', 'senate', 'parliament', 'vote', 'ballot', 'legislation',
    'democrat', 'republican', 'presidency', 'white house', 'prime minister', 'cabinet',
    'opposition', 'campaign', 'supreme court', 'judiciary', 'impeach', 'referendum',
    'political party', 'lawmaker', 'senator', 'governor', 'mayor', 'bill passed',
  ],
  MARKETS: ['stock', 'shares', 'market rally', 'index', 'dow', 'nasdaq', 's&p', 'wall street', 'ipo', 'dividend', 'earnings', 'trading', 'investor', 'equit'],
  ECONOMICS: ['inflation', 'gdp', 'interest rate', 'central bank', 'recession', 'employment', 'jobs report', 'fiscal', 'monetary', 'treasury', 'imf', 'world bank', 'debt', 'budget', 'tariff', 'trade deficit'],
  GEOPOLITICS: ['war', 'troops', 'missile', 'nuclear', 'ceasefire', 'invasion', 'territorial', 'sanctions', 'diplomatic', 'ambassador', 'nato', 'un security council', 'refugee crisis', 'conflict', 'airstrike'],
  TECH: ['ai', 'artificial intelligence', 'tech', 'software', 'chip', 'semiconductor', 'google', 'apple', 'microsoft', 'meta', 'nvidia', 'startup', 'hack', 'data breach', 'cloud', 'quantum'],
  ENERGY: ['oil', 'gas', 'opec', 'renewable', 'solar', 'nuclear power', 'pipeline', 'crude', 'fuel', 'coal', 'wind energy', 'electricity'],
  DEFENSE: ['pentagon', 'weapons', 'arms deal', 'navy', 'air force', 'army', 'drone strike', 'intelligence agency', 'cia', 'defense spending'],
  CYBER: ['ransomware', 'cyber attack', 'breach', 'vulnerability', 'malware', 'phishing', 'encryption', 'cybersecurity'],
};


const URGENCY_KEYWORDS: Record<string, string[]> = {
  FLASH: ['breaking', 'flash', 'just in', 'alert', 'emergency', 'crisis'],
  URGENT: ['urgent', 'developing', 'surge', 'crash', 'plunge', 'soar', 'spike', 'halt', 'collapse', 'record'],
  BULLETIN: ['update', 'report', 'announce', 'reveal', 'confirm', 'warns'],
};

function categorize(headline: string, defaultCategory: string): string {
  const lower = headline.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return defaultCategory;
}

function assignUrgency(headline: string): string {
  const lower = headline.toLowerCase();
  for (const [urgency, keywords] of Object.entries(URGENCY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return urgency;
    }
  }
  return 'NORMAL';
}

// Map source names to our intel source types
function mapSource(source: string): string {
  const map: Record<string, string> = {
    'REUTERS': 'T1 WIRE',
    'CNBC': 'FININT',
    'BBC': 'OSINT',
    'NYT': 'OSINT',
    'AL JAZEERA': 'OSINT',
    'SKY NEWS': 'OSINT',
    'GDELT': 'SIGINT',
  };
  return map[source] || 'OSINT';
}

// ===== HTML ENTITY DECODER =====
// RSS feeds return raw XML with numeric/named HTML entities that browsers render
// but Node doesn't auto-decode. Strip them all so headlines render cleanly.
function decodeHtml(raw: string): string {
  return raw
    // Named entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Numeric entities — convert codepoint to char, but filter junk invisible chars
    .replace(/&#(\d+);/g, (_, code) => {
      const n = parseInt(code, 10);
      // Drop invisible/control characters (word joiners, zero-width spaces etc.)
      if (n === 8288 || n === 8203 || n === 8239 || n === 65279 || n < 32) return '';
      return String.fromCodePoint(n);
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const n = parseInt(hex, 16);
      if (n === 0x2060 || n === 0x200B || n === 0x202F || n === 0xFEFF || n < 32) return '';
      return String.fromCodePoint(n);
    })
    // Collapse multiple spaces and trim
    .replace(/\s+/g, ' ')
    .trim();
}

// ===== RSS PARSER =====
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

async function fetchRSSFeed(feedConfig: typeof RSS_FEEDS[0]): Promise<FeedItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(feedConfig.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'T1-Terminal/1.0 (News Aggregator)' },
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = xmlParser.parse(xml);

    const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    const itemArray = Array.isArray(items) ? items : [items];

    return itemArray.slice(0, 10).map((item: Record<string, unknown>) => {
      const title = (item.title as string) || '';
      const rawHeadline = typeof title === 'object' ? (title as Record<string, string>)['#text'] || '' : title;
      const headline = decodeHtml(rawHeadline);
      const pubDate = (item.pubDate as string) || (item.published as string) || (item.updated as string) || '';
      const link = (item.link as string) || ((item.link as Record<string, string>)?.['@_href']) || '';
      const timestamp = pubDate ? new Date(pubDate).getTime() : Date.now();

      return {
        headline,
        source: mapSource(feedConfig.source),
        category: categorize(headline, feedConfig.defaultCategory),
        urgency: assignUrgency(headline),
        timestamp: isNaN(timestamp) ? Date.now() : timestamp,
        link: typeof link === 'string' ? link : '',
      };
    }).filter((item: FeedItem) => item.headline.length > 10);
  } catch {
    return [];
  }
}


// ===== GDELT FETCHER =====
async function fetchGDELT(): Promise<FeedItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      'https://api.gdeltproject.org/api/v2/doc/doc?query=&mode=ArtList&maxrecords=30&format=json&sort=DateDesc',
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json();
    const articles = data?.articles || [];

    return articles.map((article: Record<string, unknown>) => {
      const headline = (article.title as string) || '';
      const timestamp = (article.seendate as string)
        ? new Date(article.seendate as string).getTime()
        : Date.now();
      const domain = (article.domain as string) || '';

      return {
        headline: headline.trim(),
        source: 'SIGINT',
        category: categorize(headline, 'GEOPOLITICS'),
        urgency: assignUrgency(headline),
        timestamp: isNaN(timestamp) ? Date.now() : timestamp,
        link: (article.url as string) || '',
        region: domain.endsWith('.uk') ? 'EU' : domain.endsWith('.jp') ? 'APAC' : undefined,
      };
    }).filter((item: FeedItem) => item.headline.length > 10);
  } catch {
    return [];
  }
}

// ===== CACHE =====
let cache: { data: FeedItem[]; timestamp: number } | null = null;
const CACHE_TTL = 60_000; // 60 seconds
// Force cache bust on redeploy
cache = null;

// ===== API HANDLER =====
export async function GET() {
  // Return cached if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json({
      items: cache.data,
      cached: true,
      sources: RSS_FEEDS.length + 1,
      timestamp: cache.timestamp,
    });
  }

  // Fetch all sources in parallel
  const [rssResults, gdeltResults] = await Promise.all([
    Promise.allSettled(RSS_FEEDS.map(fetchRSSFeed)),
    fetchGDELT(),
  ]);

  // Flatten RSS results
  const rssItems = rssResults
    .filter((r): r is PromiseFulfilledResult<FeedItem[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);

  // Merge and deduplicate (by headline similarity)
  const allItems = [...rssItems, ...gdeltResults];
  const seen = new Set<string>();
  const deduped = allItems.filter(item => {
    const key = item.headline.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by timestamp (newest first)
  deduped.sort((a, b) => b.timestamp - a.timestamp);

  // Cache
  cache = { data: deduped.slice(0, 100), timestamp: Date.now() };

  return NextResponse.json({
    items: cache.data,
    cached: false,
    sources: RSS_FEEDS.length + 1,
    timestamp: cache.timestamp,
  });
}
