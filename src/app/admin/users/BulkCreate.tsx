'use client';

import { useState } from 'react';
import { Plus, CheckCircle, XCircle, Loader2, Copy, Download } from 'lucide-react';

interface CreatedUser { email: string; password: string; }

export default function BulkCreateTool() {
  const [createPrefix, setCreatePrefix] = useState('t1user');
  const [createDomain, setCreateDomain] = useState('t1terminal.app');
  const [createCount, setCreateCount] = useState('100');
  const [creating, setCreating] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);
  const [createProgress, setCreateProgress] = useState('');
  const [createError, setCreateError] = useState('');

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
        setCreateProgress(`✓ Created ${data.createdCount} users. ${data.failedCount > 0 ? `${data.failedCount} existed.` : ''}`);
        // Refresh page to show new users in the server component
        if (data.createdCount > 0) setTimeout(() => window.location.reload(), 1500);
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

  return (
    <div className="space-y-4">
      {/* Config form */}
      <div className="glass rounded-xl border border-[var(--t1-border)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus size={14} className="text-[var(--t1-accent-green)]" />
          <h2 className="text-sm font-bold text-white">Bulk Provision Operators</h2>
        </div>
        <p className="text-xs text-[var(--t1-text-muted)] leading-relaxed">
          Generates accounts like <code className="text-[var(--t1-accent-cyan)]">{createPrefix}001@{createDomain}</code> through <code className="text-[var(--t1-accent-cyan)]">{createPrefix}{createCount.padStart(3,'0')}@{createDomain}</code>.
        </p>
        
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--t1-text-muted)] font-mono uppercase">Prefix</label>
            <input value={createPrefix} onChange={e => setCreatePrefix(e.target.value)}
              className="w-full bg-[var(--t1-bg-primary)] border border-[var(--t1-border)] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--t1-border-glow)] font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--t1-text-muted)] font-mono uppercase">Domain</label>
            <input value={createDomain} onChange={e => setCreateDomain(e.target.value)}
              className="w-full bg-[var(--t1-bg-primary)] border border-[var(--t1-border)] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--t1-border-glow)] font-mono" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--t1-text-muted)] font-mono uppercase">Count</label>
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
          className="w-full flex justify-center items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--t1-accent-green)]/20 border border-[var(--t1-accent-green)]/40 text-[var(--t1-accent-green)] text-sm font-bold hover:bg-[var(--t1-accent-green)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          {creating ? `Provisioning…` : `Create ${createCount} Users`}
        </button>
        {createProgress && <p className="text-xs text-[var(--t1-text-muted)] font-mono text-center">{createProgress}</p>}
      </div>

      {/* Credentials table */}
      {createdUsers.length > 0 && (
        <div className="glass rounded-xl border border-[var(--t1-border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--t1-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={13} className="text-green-400" />
              <span className="text-sm font-bold text-white">{createdUsers.length} Credentials</span>
            </div>
            <div className="flex gap-2">
              <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-[var(--t1-border)] text-xs text-[var(--t1-text-muted)] hover:text-white transition-colors font-mono">
                <Copy size={11} /> Copy
              </button>
              <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--t1-accent-green)]/10 border border-[var(--t1-accent-green)]/30 text-[var(--t1-accent-green)] text-xs hover:bg-[var(--t1-accent-green)]/20 transition-colors">
                <Download size={11} /> CSV
              </button>
            </div>
          </div>
          <div className="px-4 py-1.5 bg-[var(--t1-bg-tertiary)] border-b border-[var(--t1-border)] grid grid-cols-2 gap-4 text-[9px] font-mono uppercase text-[var(--t1-text-muted)]">
            <span>Email</span><span>Password</span>
          </div>
          <div className="divide-y divide-[var(--t1-border)] max-h-64 overflow-y-auto font-mono text-xs">
            {createdUsers.map((u, i) => (
              <div key={i} className="px-4 py-2 grid grid-cols-2 gap-4 hover:bg-[var(--t1-bg-tertiary)] transition-colors">
                <span className="text-[var(--t1-accent-cyan)] truncate">{u.email}</span>
                <span className="text-white">{u.password}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
