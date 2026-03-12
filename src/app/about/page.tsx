import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — T1 Terminal',
  description: 'T1 Terminal is an open-source Bloomberg-grade intelligence terminal created by Muditya Raghav.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--t1-bg-primary)] text-[var(--t1-text-primary)] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--t1-accent-green)]/10 border border-[var(--t1-accent-green)]/30 flex items-center justify-center">
            <span className="text-xl font-black font-mono text-[var(--t1-accent-green)]">T1</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">T1 Terminal</h1>
            <p className="text-xs text-[var(--t1-text-muted)] font-mono tracking-widest">OPEN SOURCE INTELLIGENCE PLATFORM</p>
          </div>
        </div>

        {/* Description */}
        <div className="glass rounded-2xl p-6 border border-[var(--t1-border)] space-y-4">
          <h2 className="text-base font-bold text-[var(--t1-accent-green)]">About T1</h2>
          <p className="text-sm text-[var(--t1-text-secondary)] leading-relaxed">
            T1 Terminal is a free, open-source Bloomberg-grade intelligence platform built to help
            <strong className="text-white"> professionals, students, journalists, diplomats, researchers,
            and government organizations</strong> stay updated with real-time global intelligence —
            without the paywall.
          </p>
          <p className="text-sm text-[var(--t1-text-secondary)] leading-relaxed">
            It aggregates live news from trusted global wire services (BBC, Reuters, NYT, CNBC, Al Jazeera)
            and the GDELT geopolitical database, categorized intelligently for fast scanning across
            Markets, Economics, Geopolitics, Defense, Tech, Energy, Cyber, and UPSC-specific content.
          </p>
        </div>

        {/* Creator */}
        <div className="glass rounded-2xl p-6 border border-[var(--t1-border)] space-y-4">
          <h2 className="text-base font-bold text-[var(--t1-accent-green)]">Created By</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--t1-accent-green)]/30 to-[var(--t1-accent-cyan)]/20 border border-[var(--t1-border-glow)] flex items-center justify-center">
              <span className="text-lg font-black text-[var(--t1-accent-green)]">M</span>
            </div>
            <div>
              <p className="text-base font-bold text-white">Muditya Raghav</p>
              <p className="text-xs text-[var(--t1-text-muted)]">Developer & Creator</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-[var(--t1-border)]">
            <a
              href="mailto:mudityadev@gmail.com"
              className="flex items-center gap-2 text-sm text-[var(--t1-text-secondary)] hover:text-[var(--t1-accent-green)] transition-colors"
            >
              <span className="font-mono text-[var(--t1-accent-green)]">✉</span>
              mudityadev@gmail.com
            </a>
            <a
              href="https://mudityadev.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[var(--t1-text-secondary)] hover:text-[var(--t1-accent-cyan)] transition-colors"
            >
              <span className="font-mono text-[var(--t1-accent-cyan)]">⟶</span>
              mudityadev.vercel.app
            </a>
          </div>
        </div>

        {/* Mission */}
        <div className="glass rounded-2xl p-6 border border-[var(--t1-border)] space-y-3">
          <h2 className="text-base font-bold text-[var(--t1-accent-green)]">Mission</h2>
          <p className="text-sm text-[var(--t1-text-secondary)] leading-relaxed">
            Information is power. T1 Terminal exists to democratize access to premium-grade intelligence
            tools — the kind that were historically only available to large institutions and financial firms.
            Whether you are preparing for UPSC, tracking geopolitical events, monitoring markets, or
            covering breaking news, T1 gives you the signal, not the noise.
          </p>
        </div>

        {/* Back link */}
        <div className="flex items-center justify-between pt-2">
          <a
            href="/"
            className="text-sm text-[var(--t1-text-muted)] hover:text-white transition-colors font-mono"
          >
            ← Back to Terminal
          </a>
          <span className="text-xs text-[var(--t1-text-muted)] font-mono">T1 Terminal v0.1.0-mvp</span>
        </div>
      </div>
    </div>
  );
}
