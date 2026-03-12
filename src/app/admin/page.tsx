'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { fetchFeedback, type FeedbackRow } from '@/lib/supabase';
import {
  BarChart3, Users, Eye, MessageSquare, ExternalLink,
  RefreshCw, LogOut, Shield, LogIn, Download, Plus,
  CheckCircle, XCircle, Loader2, Search, Copy, Database,
} from 'lucide-react';

interface AdminUser {
  id: string; email: string; created_at: string;
  last_sign_in_at: string | null; email_confirmed_at: string | null;
}
interface CreatedUser { email: string; password: string; status: string; }
interface LocalStats { visits: number; pageViews: number; lastVisit: string; }
type Tab = 'overview' | 'users' | 'create' | 'feedback';

export default function AdminPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  // Data
  const [localStats, setLocalStats] = useState<LocalStats>({ visits: 0, pageViews: 0, lastVisit: '' });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Bulk create state
  const [createPrefix, setCreatePrefix] = useState('t1user');
  const [createDomain, setCreateDomain] = useState('t1terminal.app');
  const [createCount, setCreateCount] = useState('100');
  const [creating, setCreating] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [createProgress, setCreateProgress] = useState('');
  const [createError, setCreateError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem('t1_admin_stats');
      if (raw) { const s = JSON.parse(raw); setLocalStats({ visits: s.visits ?? 0, pageViews: s.pageViews ?? 0, lastVisit: s.lastVisit ?? '' }); }
    } catch {}
    const [fbRows, usersRes] = await Promise.allSettled([
      fetchFeedback(),
      fetch('/api/admin/users').then(r => r.ok ? r.json() : { users: [] }),
    ]);
    if (fbRows.status === 'fulfilled') setFeedbacks(fbRows.value);
    if (usersRes.status === 'fulfilled') setUsers(usersRes.value?.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const handleBulkCreate = async () => {
    setCreating(true);
    setCreatedUsers([]);
    setCreateError('');
    setCreateProgress(`Creating ${createCount} users…`);
    try {
      const res = await fetch('/api/admin/create-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: createPrefix, domain: createDomain, count: parseInt(createCount) }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || 'Failed'); }
      else {
        setCreatedUsers(data.created ?? []);
        setCreateProgress(`✓ Created ${data.createdCount} users. ${data.failedCount > 0 ? `${data.failedCount} already existed.` : ''}`);
        await loadData(); // refresh users list
      }
    } catch (e) { setCreateError(String(e)); }
    setCreating(false);
  };

  const downloadCSV = () => {
    const header = 'Email,Password';
    const rows = createdUsers.map(u => `${u.email},${u.password}`).join('\n');
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 't1-credentials.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const copyAll = () => {
    const text = createdUsers.map(u => `${u.email} | ${u.password}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const filteredUsers = users.filter(u =>
    !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // ── Auth Gate ──
  if (authLoading) return (
    <div className="min-h-screen bg-[var(--t1-bg-primary)] flex items-center justify-center">
      <div className="flex items-center gap-2 text-[var(--t1-text-muted)] text-sm font-mono animate-pulse">
        <Loader2 size={14} className="animate-spin" /> Checking session…
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[var(--t1-bg-primary)] flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 border border-[var(--t1-border)] w-full max-w-sm text-center space-y-4">
        <Shield size={32} className="text-[var(--t1-accent-amber)] mx-auto" />
        <h1 className="text-base font-bold text-white">Admin Access Required</h1>
        <p className="text-xs text-[var(--t1-text-muted)]">Sign in to access the T1 admin dashboard.</p>
        <a href="/login" className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--t1-accent-green)]/20 border border-[var(--t1-accent-green)]/40 text-[var(--t1-accent-green)] text-sm font-bold hover:bg-[var(--t1-accent-green)]/30 transition-colors">
          <LogIn size={13} /> Sign In
        </a>
        <a href="/" className="block text-xs text-[var(--t1-text-muted)] hover:text-white font-mono">← Back to Terminal</a>
      </div>
    </div>
  );

  // ── Main Admin UI ──
  return (
    <div className="min-h-screen bg-[var(--t1-bg-primary)] text-[var(--t1-text-primary)]">
      {/* Top Bar */}
      <div className="glass border-b border-[var(--t1-border)] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base font-black font-mono text-[var(--t1-accent-green)] text-glow-green">T1</span>
          <span className="text-xs font-bold text-white">Admin Dashboard</span>
          <span className="text-[10px] text-[var(--t1-text-muted)] font-mono hidden sm:inline">— {user.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="p-1.5 rounded-lg glass border border-[var(--t1-border)] text-[var(--t1-text-muted)] hover:text-white transition-colors" title="Refresh">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <a href="/" className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg glass border border-[var(--t1-border)] text-[10px] text-[var(--t1-text-muted)] hover:text-white font-mono transition-colors">
            <ExternalLink size={10} /> Terminal
          </a>
          <button onClick={signOut} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] text-red-400/70 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-colors font-mono">
            <LogOut size={10} /> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Visits', value: localStats.visits, icon: Eye, color: '#22c55e' },
            { label: 'Page Views', value: localStats.pageViews, icon: BarChart3, color: '#06b6d4' },
            { label: 'Users', value: users.length, icon: Users, color: '#a855f7' },
            { label: 'Feedbacks', value: feedbacks.length, icon: MessageSquare, color: '#f59e0b' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="glass rounded-xl p-4 border border-[var(--t1-border)] hover:border-[var(--t1-border-glow)] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--t1-text-muted)]">{s.label}</span>
                  <Icon size={12} style={{ color: s.color }} />
                </div>
                <p className="text-2xl font-black font-mono" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
              </div>
            );
          })}
        </div>

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-[var(--t1-border)] overflow-x-auto">
          {([
            { id: 'overview', label: '📊 Overview' },
            { id: 'users', label: `👥 Users (${users.length})` },
            { id: 'create', label: '➕ Create Users' },
            { id: 'feedback', label: `💬 Feedback (${feedbacks.length})` },
          ] as { id: Tab, label: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-bold font-mono border-b-2 whitespace-nowrap transition-colors -mb-px ${
                tab === t.id ? 'border-[var(--t1-accent-green)] text-white' : 'border-transparent text-[var(--t1-text-muted)] hover:text-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ── */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="glass rounded-xl p-5 border border-[var(--t1-border)] space-y-3">
                <div className="flex items-center gap-2">
                  <Database size={13} className="text-[var(--t1-accent-green)]" />
                  <span className="text-xs font-bold text-white">Supabase Connection</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle size={11} className="text-green-400" />
                  <span className="text-green-400 font-mono">Connected</span>
                </div>
                <p className="text-[10px] text-[var(--t1-text-muted)] font-mono break-all">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'URL not set'}
                </p>
              </div>
              <div className="glass rounded-xl p-5 border border-[var(--t1-border)] space-y-3">
                <div className="flex items-center gap-2">
                  <Eye size={13} className="text-[var(--t1-accent-cyan)]" />
                  <span className="text-xs font-bold text-white">Activity</span>
                </div>
                <p className="text-[10px] text-[var(--t1-text-muted)]">
                  Last visit: <span className="text-white">{localStats.lastVisit ? new Date(localStats.lastVisit).toLocaleString() : '—'}</span>
                </p>
                <p className="text-[10px] text-[var(--t1-text-muted)]">
                  Total page views: <span className="text-white">{localStats.pageViews.toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Users ── */}
        {tab === 'users' && (
          <div className="space-y-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-[var(--t1-bg-primary)] border border-[var(--t1-border)] rounded-lg px-3 focus-within:border-[var(--t1-border-glow)] transition-colors">
              <Search size={13} className="text-[var(--t1-text-muted)] shrink-0" />
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by email…" className="flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-[var(--t1-text-muted)] font-mono" />
            </div>

            <div className="glass rounded-xl border border-[var(--t1-border)] overflow-hidden">
              {/* Table header */}
              <div className="px-4 py-2 bg-[var(--t1-bg-tertiary)] border-b border-[var(--t1-border)] grid grid-cols-[1fr_auto_auto] gap-4 text-[9px] font-mono uppercase text-[var(--t1-text-muted)]">
                <span>Email</span><span className="hidden sm:block">Joined</span><span>Status</span>
              </div>
              <div className="divide-y divide-[var(--t1-border)] max-h-[500px] overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="px-4 py-10 text-center text-xs text-[var(--t1-text-muted)] font-mono">
                    {users.length === 0 ? 'No users found — add SUPABASE_SERVICE_ROLE_KEY to .env.local' : 'No matches'}
                  </div>
                ) : filteredUsers.map(u => (
                  <div key={u.id} className="px-4 py-2.5 grid grid-cols-[1fr_auto_auto] gap-4 items-center hover:bg-[var(--t1-bg-tertiary)] transition-colors group">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-white truncate">{u.email}</p>
                      {u.last_sign_in_at && (
                        <p className="text-[9px] text-[var(--t1-text-muted)] font-mono">
                          Last: {new Date(u.last_sign_in_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className="hidden sm:block text-[10px] text-[var(--t1-text-muted)] font-mono whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap ${
                      u.email_confirmed_at ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    }`}>
                      {u.email_confirmed_at ? '✓ verified' : 'unverified'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-[var(--t1-border)] text-[10px] text-[var(--t1-text-muted)] font-mono">
                {filteredUsers.length} of {users.length} users
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Create Users ── */}
        {tab === 'create' && (
          <div className="space-y-4">
            {/* Config form */}
            <div className="glass rounded-xl border border-[var(--t1-border)] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Plus size={14} className="text-[var(--t1-accent-green)]" />
                <h2 className="text-sm font-bold text-white">Bulk Create Users</h2>
              </div>
              <p className="text-xs text-[var(--t1-text-muted)]">
                Creates accounts like <code className="text-[var(--t1-accent-cyan)]">{createPrefix}001@{createDomain}</code> through <code className="text-[var(--t1-accent-cyan)]">{createPrefix}{createCount.padStart(3,'0')}@{createDomain}</code> with randomly generated passwords. You can download the CSV and manually send credentials.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--t1-text-muted)] font-mono uppercase">Username Prefix</label>
                  <input value={createPrefix} onChange={e => setCreatePrefix(e.target.value)}
                    className="w-full bg-[var(--t1-bg-primary)] border border-[var(--t1-border)] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--t1-border-glow)] font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--t1-text-muted)] font-mono uppercase">Domain</label>
                  <input value={createDomain} onChange={e => setCreateDomain(e.target.value)}
                    className="w-full bg-[var(--t1-bg-primary)] border border-[var(--t1-border)] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--t1-border-glow)] font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--t1-text-muted)] font-mono uppercase">Count (max 200)</label>
                  <input type="number" min="1" max="200" value={createCount} onChange={e => setCreateCount(e.target.value)}
                    className="w-full bg-[var(--t1-bg-primary)] border border-[var(--t1-border)] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--t1-border-glow)] font-mono" />
                </div>
              </div>
              {createError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                  <XCircle size={12} /> {createError}
                </div>
              )}
              <button onClick={handleBulkCreate} disabled={creating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--t1-accent-green)]/20 border border-[var(--t1-accent-green)]/40 text-[var(--t1-accent-green)] text-sm font-bold hover:bg-[var(--t1-accent-green)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                {creating ? `Creating…` : `Create ${createCount} Users`}
              </button>
              {createProgress && <p className="text-xs text-[var(--t1-text-muted)] font-mono">{createProgress}</p>}
            </div>

            {/* Credentials table */}
            {createdUsers.length > 0 && (
              <div className="glass rounded-xl border border-[var(--t1-border)] overflow-hidden space-y-0">
                <div className="px-4 py-3 border-b border-[var(--t1-border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={13} className="text-green-400" />
                    <span className="text-sm font-bold text-white">{createdUsers.length} Credentials</span>
                    <span className="text-[10px] text-[var(--t1-accent-amber)] font-mono">— shown once, download now</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-[var(--t1-border)] text-xs text-[var(--t1-text-muted)] hover:text-white transition-colors font-mono">
                      <Copy size={11} /> Copy all
                    </button>
                    <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--t1-accent-green)]/20 border border-[var(--t1-accent-green)]/40 text-[var(--t1-accent-green)] text-xs font-bold hover:bg-[var(--t1-accent-green)]/30 transition-colors">
                      <Download size={11} /> Download CSV
                    </button>
                  </div>
                </div>
                {/* Table */}
                <div className="px-4 py-1.5 bg-[var(--t1-bg-tertiary)] border-b border-[var(--t1-border)] grid grid-cols-2 gap-4 text-[9px] font-mono uppercase text-[var(--t1-text-muted)]">
                  <span>Email</span><span>Password</span>
                </div>
                <div className="divide-y divide-[var(--t1-border)] max-h-80 overflow-y-auto font-mono text-xs">
                  {createdUsers.map((u, i) => (
                    <div key={i} className="px-4 py-1.5 grid grid-cols-2 gap-4 hover:bg-[var(--t1-bg-tertiary)] transition-colors">
                      <span className="text-[var(--t1-accent-cyan)] truncate">{u.email}</span>
                      <span className="text-white">{u.password}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Feedback ── */}
        {tab === 'feedback' && (
          <div className="glass rounded-xl border border-[var(--t1-border)] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--t1-border)] flex justify-between">
              <span className="text-sm font-bold text-white">User Feedback</span>
              <span className="text-[10px] text-[var(--t1-text-muted)] font-mono">{feedbacks.length} entries</span>
            </div>
            <div className="divide-y divide-[var(--t1-border)]">
              {feedbacks.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs text-[var(--t1-text-muted)] font-mono">No feedback yet</div>
              ) : feedbacks.map((fb, i) => (
                <div key={i} className="px-4 py-3 hover:bg-[var(--t1-bg-tertiary)] transition-colors">
                  <div className="flex justify-between mb-1">
                    {fb.email
                      ? <a href={`mailto:${fb.email}`} className="text-xs text-[var(--t1-accent-cyan)] font-mono hover:underline">{fb.email}</a>
                      : <span className="text-xs text-[var(--t1-text-muted)] font-mono">anonymous</span>}
                    <span className="text-[10px] text-[var(--t1-text-muted)] font-mono">
                      {fb.created_at ? new Date(fb.created_at).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--t1-text-secondary)]">{fb.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
