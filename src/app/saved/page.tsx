'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { fetchSavedNews, unsaveNewsItem, type SavedNewsRow } from '@/lib/saved-news';
import {
  Bookmark, Trash2, ExternalLink, AlertTriangle, Zap, Bell, Radio,
  Search, ArrowLeft, Loader2, Shield,
} from 'lucide-react';

const URGENCY_COLORS: Record<string, string> = {
  FLASH: 'text-red-400 border-red-500/40 bg-red-500/10',
  URGENT: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  BULLETIN: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
  NORMAL: 'text-gray-500 border-transparent bg-transparent',
};

const CATEGORY_COLORS: Record<string, string> = {
  MARKETS: '#22c55e', POLITICS: '#3b82f6', ECONOMICS: '#f59e0b',
  GEOPOLITICS: '#ef4444', TECH: '#06b6d4', ENERGY: '#fb923c',
  DEFENSE: '#a855f7', CYBER: '#ec4899',
};

export default function SavedNewsFeedPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<SavedNewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const rows = await fetchSavedNews(user.id);
    setItems(rows);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (headline: string) => {
    if (!user) return;
    setDeleting(headline);
    await unsaveNewsItem(user.id, headline);
    setItems(prev => prev.filter(i => i.headline !== headline));
    setDeleting(null);
  };

  const filtered = search.trim()
    ? items.filter(i =>
        i.headline.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase()) ||
        i.source.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  // Not logged in
  if (!authLoading && !user) return (
    <div className="min-h-screen bg-[var(--t1-bg-primary)] flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 border border-[var(--t1-border)] w-full max-w-sm text-center space-y-4">
        <Shield size={32} className="text-[var(--t1-accent-amber)] mx-auto" />
        <h1 className="text-base font-bold text-white">Sign in to view saved news</h1>
        <p className="text-xs text-[var(--t1-text-muted)]">Your saved articles are stored securely in your account.</p>
        <a href="/login" className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--t1-accent-green)]/20 border border-[var(--t1-accent-green)]/40 text-[var(--t1-accent-green)] text-sm font-bold hover:bg-[var(--t1-accent-green)]/30 transition-colors">
          Sign In
        </a>
        <a href="/" className="block text-xs text-[var(--t1-text-muted)] hover:text-white font-mono">← Back to Terminal</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--t1-bg-primary)] text-[var(--t1-text-primary)]">
      {/* Header */}
      <div className="glass border-b border-[var(--t1-border)] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-1.5 text-[var(--t1-text-muted)] hover:text-white transition-colors">
            <ArrowLeft size={14} />
          </a>
          <Bookmark size={14} className="text-[var(--t1-accent-green)]" />
          <span className="text-sm font-bold text-white">Saved News</span>
          {!loading && <span className="text-[10px] text-[var(--t1-text-muted)] font-mono">{items.length} articles</span>}
        </div>
        <span className="text-[10px] text-[var(--t1-text-muted)] font-mono hidden sm:inline">{user?.email}</span>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[var(--t1-bg-primary)] border border-[var(--t1-border)] rounded-lg px-3 focus-within:border-[var(--t1-border-glow)] transition-colors">
          <Search size={13} className="text-[var(--t1-text-muted)] shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search saved articles…"
            className="flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-[var(--t1-text-muted)] font-mono" />
        </div>

        {/* Loading */}
        {(loading || authLoading) && (
          <div className="flex items-center justify-center py-16 gap-2 text-[var(--t1-text-muted)]">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm font-mono">Loading saved articles…</span>
          </div>
        )}

        {/* Empty */}
        {!loading && !authLoading && filtered.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Bookmark size={32} className="text-[var(--t1-text-muted)] mx-auto" />
            <p className="text-sm text-[var(--t1-text-muted)] font-mono">
              {items.length === 0 ? 'No saved articles yet.' : 'No results for your search.'}
            </p>
            <a href="/" className="text-xs text-[var(--t1-accent-green)] hover:underline font-mono">← Go to Live Feed</a>
          </div>
        )}

        {/* Articles */}
        {!loading && filtered.map((item, i) => {
          const urgencyClass = URGENCY_COLORS[item.urgency] || URGENCY_COLORS.NORMAL;
          const catColor = CATEGORY_COLORS[item.category] || '#6b7280';
          const UrgencyIcon = item.urgency === 'FLASH' ? Zap : item.urgency === 'URGENT' ? AlertTriangle : item.urgency === 'BULLETIN' ? Bell : Radio;

          return (
            <div key={i} className="glass rounded-xl border border-[var(--t1-border)] hover:border-[var(--t1-border-glow)] transition-all p-4 space-y-2 group">
              {/* Tags row */}
              <div className="flex items-center flex-wrap gap-1.5">
                {item.urgency !== 'NORMAL' && (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest border ${urgencyClass}`}>
                    <UrgencyIcon size={8} /> {item.urgency}
                  </span>
                )}
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border"
                  style={{ color: catColor, backgroundColor: catColor + '18', borderColor: catColor + '35' }}>
                  {item.category}
                </span>
                {item.ticker && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--t1-accent-cyan)]/30 bg-[var(--t1-accent-cyan)]/10 text-[var(--t1-accent-cyan)]">
                    ${item.ticker}
                  </span>
                )}
                {item.region && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--t1-border)] text-[var(--t1-text-muted)]">
                    {item.region}
                  </span>
                )}
                <span className="ml-auto text-[9px] text-[var(--t1-text-muted)] font-mono">
                  {item.saved_at ? new Date(item.saved_at).toLocaleDateString() : ''}
                </span>
              </div>

              {/* Headline */}
              <p className="text-sm text-[var(--t1-text-primary)] font-medium leading-snug">{item.headline}</p>

              {/* Footer row */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-[var(--t1-text-muted)] font-mono">{item.source}</span>
                <div className="flex items-center gap-2">
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 rounded glass border border-[var(--t1-border)] text-[10px] text-[var(--t1-text-muted)] hover:text-white transition-colors">
                      <ExternalLink size={10} /> Read
                    </a>
                  )}
                  <button onClick={() => handleDelete(item.headline)} disabled={deleting === item.headline}
                    className="flex items-center gap-1 px-2 py-1 rounded border border-red-500/30 text-[10px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    {deleting === item.headline ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
