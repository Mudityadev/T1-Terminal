'use client';

import { useState, useEffect } from 'react';
import { Wifi, Clock, Activity, Globe2, MessageSquare, Info, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

function getMarketSession(): { label: string; status: 'open' | 'closed' } {
  const utcHour = new Date().getUTCHours();
  if (utcHour >= 13 && utcHour < 21) return { label: 'US MARKET OPEN', status: 'open' };
  if (utcHour >= 8 && utcHour < 16) return { label: 'EU MARKET OPEN', status: 'open' };
  if (utcHour >= 0 && utcHour < 7) return { label: 'ASIA MARKET OPEN', status: 'open' };
  return { label: 'MARKETS CLOSED', status: 'closed' };
}

interface Props { onFeedback?: () => void; }

export default function StatusBar({ onFeedback }: Props) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [session, setSession] = useState<{ label: string; status: 'open' | 'closed' } | null>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    setSession(getMarketSession());
    const iv = setInterval(() => {
      setTime(new Date());
      setSession(getMarketSession());
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const utcTime = mounted && time ? time.toUTCString().split(' ')[4] : '--:--:--';
  const localTime = mounted && time ? time.toLocaleTimeString('en-US', { hour12: false }) : '--:--:--';

  return (
    <div className="h-7 flex items-center justify-between px-3 glass border-t border-[var(--t1-border)] text-[9px] font-mono shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[var(--t1-accent-green)]">
          <Wifi size={9} /><span>CONNECTED</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--t1-text-muted)]">
          <Activity size={9} className="text-[var(--t1-accent-green)] animate-pulse-glow" /><span>LIVE DATA</span>
        </div>
        {session && (
          <div className={`hidden sm:flex items-center gap-1.5 ${session.status === 'open' ? 'text-[var(--t1-accent-green)]' : 'text-[var(--t1-accent-red)]'}`}>
            <Globe2 size={9} /><span>{session.label}</span>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* About */}
        <a href="/about" className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[var(--t1-bg-tertiary)] text-[var(--t1-text-muted)] hover:text-white transition-colors">
          <Info size={9} /><span className="hidden sm:inline">About</span>
        </a>

        {/* Feedback */}
        <button onClick={onFeedback} className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--t1-accent-green)]/10 border border-[var(--t1-accent-green)]/25 text-[var(--t1-accent-green)] hover:bg-[var(--t1-accent-green)]/20 transition-colors">
          <MessageSquare size={9} /><span className="hidden sm:inline">Feedback</span>
        </button>

        {/* Auth: show user email + logout, or login link */}
        {user ? (
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-[var(--t1-border)]">
            <User size={9} className="text-[var(--t1-accent-cyan)] shrink-0" />
            <span className="text-[var(--t1-accent-cyan)] max-w-[120px] truncate" title={user.email ?? ''}>
              {user.email}
            </span>
            <button onClick={signOut} title="Sign out" className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[var(--t1-text-muted)] hover:text-red-400 transition-colors">
              <LogOut size={9} />
            </button>
          </div>
        ) : (
          <a href="/login" className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--t1-border)] text-[var(--t1-text-muted)] hover:text-white hover:border-[var(--t1-border-glow)] transition-colors">
            <LogIn size={9} /><span>Login</span>
          </a>
        )}

        {/* Version */}
        <span className="hidden lg:inline text-[var(--t1-text-muted)] pl-2 border-l border-[var(--t1-border)]">T1 v0.1.0-MVP</span>

        {/* Clocks */}
        <div className="hidden md:flex items-center gap-3 pl-2 border-l border-[var(--t1-border)]">
          <div className="flex items-center gap-1 text-[var(--t1-text-secondary)]">
            <Clock size={9} /><span>UTC {utcTime}</span>
          </div>
          <div className="text-[var(--t1-accent-green)] text-glow-green">{localTime}</div>
        </div>
      </div>
    </div>
  );
}
