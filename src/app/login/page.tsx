'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, X, UserPlus } from 'lucide-react';
import { signIn } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSignUpPopup, setShowSignUpPopup] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) router.replace('/');
      });
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    const { error, session } = await signIn(email, password);
    if (error) { setError(error.message); setLoading(false); return; }
    if (session) router.replace('/');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--t1-bg-primary)] flex items-center justify-center p-6 grid-pattern">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-xl border border-[var(--t1-border-glow)]">
            <Terminal size={16} className="text-[var(--t1-accent-green)]" />
            <span className="text-base font-black font-mono text-[var(--t1-accent-green)] text-glow-green">T1 TERMINAL</span>
          </div>
          <p className="text-xs text-[var(--t1-text-muted)] font-mono tracking-widest">SIGN IN TO ACCESS</p>
        </div>

        {/* Sign-in Card */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl border border-[var(--t1-border)] p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">{error}</div>
          )}

          {/* Email */}
          <div className="flex items-center gap-2 bg-[var(--t1-bg-primary)] border border-[var(--t1-border)] rounded-lg px-3 focus-within:border-[var(--t1-border-glow)] transition-colors">
            <Mail size={13} className="text-[var(--t1-text-muted)] shrink-0" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email address" required autoFocus
              className="flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-[var(--t1-text-muted)] font-mono" />
          </div>

          {/* Password */}
          <div className="flex items-center gap-2 bg-[var(--t1-bg-primary)] border border-[var(--t1-border)] rounded-lg px-3 focus-within:border-[var(--t1-border-glow)] transition-colors">
            <Lock size={13} className="text-[var(--t1-text-muted)] shrink-0" />
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password" required minLength={6}
              className="flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-[var(--t1-text-muted)] font-mono" />
            <button type="button" onClick={() => setShowPass(p => !p)} className="text-[var(--t1-text-muted)] hover:text-white transition-colors shrink-0">
              {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>

          {/* Sign In button */}
          <button type="submit" disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--t1-accent-green)]/20 border border-[var(--t1-accent-green)]/40 text-[var(--t1-accent-green)] font-bold text-sm hover:bg-[var(--t1-accent-green)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Sign In
          </button>

          {/* Sign Up link → triggers popup */}
          <p className="text-center text-xs text-[var(--t1-text-muted)]">
            {"Don't have an account? "}
            <button type="button" onClick={() => setShowSignUpPopup(true)}
              className="text-[var(--t1-accent-cyan)] hover:underline">
              Sign Up
            </button>
          </p>
        </form>

        {/* Back */}
        <div className="flex justify-center">
          <a href="/" className="flex items-center gap-1.5 text-xs text-[var(--t1-text-muted)] hover:text-white transition-colors font-mono">
            <ArrowLeft size={11} /> Continue as guest
          </a>
        </div>
      </div>

      {/* ── Sign Up Popup ── */}
      {showSignUpPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSignUpPopup(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm glass rounded-2xl border border-[var(--t1-border-glow)] p-6 text-center space-y-4 animate-fade-in-up"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowSignUpPopup(false)}
              className="absolute top-3 right-3 text-[var(--t1-text-muted)] hover:text-white transition-colors">
              <X size={14} />
            </button>
            <div className="w-12 h-12 rounded-full bg-[var(--t1-accent-cyan)]/10 border border-[var(--t1-accent-cyan)]/30 flex items-center justify-center mx-auto">
              <UserPlus size={20} className="text-[var(--t1-accent-cyan)]" />
            </div>
            <h2 className="text-base font-bold text-white">Registration Required</h2>
            <p className="text-sm text-[var(--t1-text-secondary)] leading-relaxed">
              T1 Terminal is invite-only. To request access, please contact:
            </p>
            <a href="mailto:mudityadev@gmail.com?subject=T1 Terminal Access Request"
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--t1-accent-cyan)]/10 border border-[var(--t1-accent-cyan)]/30 text-[var(--t1-accent-cyan)] text-sm font-bold hover:bg-[var(--t1-accent-cyan)]/20 transition-colors">
              <Mail size={13} />
              mudityadev@gmail.com
            </a>
            <button onClick={() => setShowSignUpPopup(false)}
              className="w-full py-2 rounded-lg glass border border-[var(--t1-border)] text-xs text-[var(--t1-text-muted)] hover:text-white transition-colors font-mono">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
