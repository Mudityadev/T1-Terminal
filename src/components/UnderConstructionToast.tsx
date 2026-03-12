'use client';

import { useState, useEffect, useCallback } from 'react';
import { Construction } from 'lucide-react';

interface Toast {
  id: number;
  page: string;
}

export default function UnderConstructionToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((page: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, page }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Listen for custom event from Sidebar
  useEffect(() => {
    const handler = (e: CustomEvent) => showToast(e.detail.page);
    window.addEventListener('t1:underconstruction', handler as EventListener);
    return () => window.removeEventListener('t1:underconstruction', handler as EventListener);
  }, [showToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl glass border border-[var(--t1-border-glow)] shadow-2xl animate-fade-in-up"
          style={{ background: 'rgba(10,14,26,0.95)' }}
        >
          <Construction size={15} className="text-[var(--t1-accent-amber)] shrink-0" />
          <div>
            <span className="text-xs font-bold text-white">{toast.page}</span>
            <span className="text-xs text-[var(--t1-text-muted)] ml-1.5">— Under Construction</span>
          </div>
          <div className="ml-3 w-20 h-1 rounded-full bg-[var(--t1-border)] overflow-hidden">
            <div
              className="h-full bg-[var(--t1-accent-amber)] rounded-full"
              style={{ animation: 'shrink-bar 3s linear forwards' }}
            />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes shrink-bar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// Helper to fire the toast from anywhere
export function fireUnderConstruction(page: string) {
  window.dispatchEvent(new CustomEvent('t1:underconstruction', { detail: { page } }));
}
