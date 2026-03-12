'use client';

import { useEffect, useState } from 'react';
import { Zap, X } from 'lucide-react';

interface FlashAlert {
  id: number;
  headline: string;
  source: string;
  link?: string;
}

export default function FlashAlertBanner() {
  const [alerts, setAlerts] = useState<FlashAlert[]>([]);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { headline, source, link } = e.detail;
      const id = Date.now();
      setAlerts(prev => [{ id, headline, source, link }, ...prev].slice(0, 3));
      // Auto-dismiss after 8 seconds
      setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 8000);
    };
    window.addEventListener('t1:flash', handler as EventListener);
    return () => window.removeEventListener('t1:flash', handler as EventListener);
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-10 right-3 z-[9998] flex flex-col gap-1.5 max-w-sm w-full pointer-events-none">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className="pointer-events-auto flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-red-500/50 shadow-2xl animate-slide-in-right"
          style={{ background: 'rgba(10,5,5,0.97)', backdropFilter: 'blur(12px)', boxShadow: '0 0 20px rgba(239,68,68,0.2)' }}
        >
          {/* Pulsing red dot */}
          <div className="relative mt-0.5 shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-75" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Zap size={9} className="text-red-400 shrink-0" />
              <span className="text-[9px] font-black tracking-[0.15em] text-red-400">FLASH ALERT</span>
              <span className="text-[8px] text-[var(--t1-text-muted)] font-mono ml-auto">{alert.source}</span>
            </div>
            {alert.link ? (
              <a
                href={alert.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-semibold text-white leading-snug hover:text-red-200 transition-colors line-clamp-2 no-underline block"
              >
                {alert.headline}
              </a>
            ) : (
              <p className="text-[10px] font-semibold text-white leading-snug line-clamp-2">{alert.headline}</p>
            )}
          </div>
          <button
            onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
            className="shrink-0 mt-0.5 text-[var(--t1-text-muted)] hover:text-white transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Fire a FLASH alert from anywhere
export function fireFlashAlert(headline: string, source: string, link?: string) {
  window.dispatchEvent(new CustomEvent('t1:flash', { detail: { headline, source, link } }));
}
