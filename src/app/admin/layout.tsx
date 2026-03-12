'use client';

import { useAuth } from '@/components/AuthProvider';
import {
  LayoutDashboard, Users, MessageSquare, Shield,
  LogOut, ExternalLink, Loader2, Database,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const pathname = usePathname();

  if (authLoading) return (
    <div className="min-h-screen bg-[var(--t1-bg-primary)] flex items-center justify-center">
      <div className="flex items-center gap-2 text-[var(--t1-text-muted)] text-sm font-mono animate-pulse">
        <Loader2 size={14} className="animate-spin" /> Checking permissions…
      </div>
    </div>
  );

  // Fallback if middleware somehow misses it
  if (!user) return (
    <div className="min-h-screen bg-[var(--t1-bg-primary)] flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 border border-[var(--t1-border)] w-full max-w-sm text-center space-y-4">
        <Shield size={32} className="text-[var(--t1-accent-amber)] mx-auto" />
        <h1 className="text-base font-bold text-white">Admin Access Required</h1>
        <p className="text-xs text-[var(--t1-text-muted)]">Sign in to access the T1 admin dashboard.</p>
        <Link href="/login" className="flex items-center gap-2 py-2.5 rounded-lg bg-[var(--t1-accent-green)]/20 border border-[var(--t1-accent-green)]/40 text-[var(--t1-accent-green)] text-sm font-bold hover:bg-[var(--t1-accent-green)]/30 transition-colors justify-center">
          Sign In
        </Link>
      </div>
    </div>
  );

  const links = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Feedback', path: '/admin/feedback', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[var(--t1-bg-primary)] text-[var(--t1-text-primary)] flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 glass border-b md:border-b-0 md:border-r border-[var(--t1-border)] flex flex-col shrink-0 md:min-h-screen md:sticky md:top-0">
        <div className="p-5 border-b border-[var(--t1-border)] flex items-center justify-between md:block">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black font-mono text-[var(--t1-accent-green)] text-glow-green">T1</span>
              <span className="text-sm font-bold text-white">Admin</span>
            </div>
            <p className="text-[10px] text-[var(--t1-text-muted)] font-mono mt-1 hidden md:block">
              {user.email}
            </p>
          </div>
          {/* Mobile Terminal Link */}
          <Link href="/" className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg glass border border-[var(--t1-border)] text-xs text-[var(--t1-text-muted)] hover:text-white font-mono transition-colors">
            <ExternalLink size={12} /> Terminal
          </Link>
        </div>

        <nav className="p-3 flex gap-1 overflow-x-auto md:flex-col md:overflow-visible flex-1">
          {links.map(l => {
            const isActive = pathname === l.path;
            const Icon = l.icon;
            return (
              <Link key={l.path} href={l.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'bg-[var(--t1-accent-green)]/10 text-[var(--t1-accent-green)] font-bold' 
                    : 'text-[var(--t1-text-muted)] hover:text-white hover:bg-[var(--t1-bg-tertiary)]'
                }`}>
                <Icon size={16} />
                {l.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--t1-border)] hidden md:block space-y-2">
          <Link href="/" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-mono text-[var(--t1-text-muted)] hover:text-white hover:bg-[var(--t1-bg-tertiary)] transition-colors">
            <ExternalLink size={14} /> Back to Terminal
          </Link>
          <button onClick={signOut} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-mono text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 md:p-8">
        <div className="w-full max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
