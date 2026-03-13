'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PageEntranceProps {
  children: React.ReactNode;
  className?: string;
  /** Milliseconds before the boot overlay fades out and children appear */
  bootDuration?: number;
}

/**
 * PageEntrance — wraps a page with a cinematic terminal-boot entrance.
 * Phase 1 (0 → bootDuration): A dark overlay with a CRT-flicker animation.
 * Phase 2 (bootDuration+): Overlay fades out, children reveal with blur+slide.
 */
export default function PageEntrance({
  children,
  className,
  bootDuration = 500,
}: PageEntranceProps) {
  const [booted, setBooted] = useState(false);
  const [overlayDone, setOverlayDone] = useState(false);

  useEffect(() => {
    const bootTimer = setTimeout(() => setBooted(true), bootDuration);
    const overlayTimer = setTimeout(() => setOverlayDone(true), bootDuration + 1200);
    return () => {
      clearTimeout(bootTimer);
      clearTimeout(overlayTimer);
    };
  }, [bootDuration]);

  return (
    <div className={cn('relative', className)}>
      {/* Boot overlay — CRT power-on flicker */}
      {!overlayDone && (
        <div
          className={cn(
            'fixed inset-0 z-[9999] bg-[var(--t1-bg-primary)] flex items-center justify-center pointer-events-none',
            booted ? 'animate-boot-overlay-out' : 'animate-terminal-boot'
          )}
          aria-hidden="true"
        >
          {!booted && (
            <div className="flex flex-col items-center gap-3 select-none">
              {/* T1 Terminal Logo */}
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--t1-accent-green)] animate-pulse-glow" />
                <span className="text-[var(--t1-accent-green)] font-mono text-xl font-bold tracking-[0.4em] text-glow-green">
                  T1 TERMINAL
                </span>
                <div className="w-2 h-2 rounded-full bg-[var(--t1-accent-green)] animate-pulse-glow" />
              </div>
              {/* Boot progress bar */}
              <div className="w-48 h-[2px] bg-[var(--t1-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--t1-accent-green)] rounded-full origin-left"
                  style={{
                    animation: `scaleX-in ${bootDuration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                    transformOrigin: 'left',
                    transform: 'scaleX(0)',
                  }}
                />
              </div>
              <span className="text-[var(--t1-text-muted)] font-mono text-[10px] tracking-widest">
                INITIALIZING SYSTEM…
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content — slides in after boot */}
      <div
        className={cn(
          'transition-[opacity,filter,transform]',
          'duration-700',
          booted
            ? 'opacity-100 blur-0 translate-y-0'
            : 'opacity-0 blur-[12px] translate-y-4'
        )}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          transitionDelay: booted ? '100ms' : '0ms',
        }}
      >
        {children}
      </div>
    </div>
  );
}
