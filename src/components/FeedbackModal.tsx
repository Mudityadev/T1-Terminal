'use client';

import { useState } from 'react';
import { X, Send, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { submitFeedback } from '@/lib/analytics';
import { insertFeedback } from '@/lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ open, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!open) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    setStatus('sending');
    setErrorMsg('');

    const result = await insertFeedback(email || '', message.trim());
    submitFeedback(email || 'anonymous', message.trim()); // always cache locally

    if (!result.ok && result.message !== 'not_configured') {
      // Real Supabase error — show it
      setErrorMsg(result.message ?? 'Failed to send. Please try again.');
      setStatus('error');
      return;
    }

    setStatus('sent');
    setTimeout(() => {
      setStatus('idle');
      setEmail('');
      setMessage('');
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-[9995] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md glass rounded-2xl border border-[var(--t1-border-glow)] shadow-2xl p-5 space-y-4 animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-[var(--t1-accent-green)]" />
            <h2 className="text-sm font-bold text-white">Send Feedback</h2>
          </div>
          <button onClick={onClose} className="text-[var(--t1-text-muted)] hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {status === 'sent' ? (
          <div className="text-center py-8 space-y-2">
            <CheckCircle size={28} className="text-[var(--t1-accent-green)] mx-auto" />
            <p className="text-sm font-bold text-[var(--t1-accent-green)]">Feedback received!</p>
            <p className="text-xs text-[var(--t1-text-muted)]">Thank you — stored in Supabase ✓</p>
          </div>
        ) : status === 'error' ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm font-bold text-red-400">Failed to send</p>
            <p className="text-xs text-[var(--t1-text-muted)] font-mono break-all">{errorMsg}</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setStatus('idle')} className="px-4 py-1.5 rounded-lg glass border border-[var(--t1-border)] text-xs text-white hover:bg-[var(--t1-bg-tertiary)] transition-colors">
                Try Again
              </button>
              <a href={`mailto:mudityadev@gmail.com?subject=T1 Feedback&body=${encodeURIComponent(message)}`}
                className="px-4 py-1.5 rounded-lg bg-[var(--t1-accent-green)]/20 border border-[var(--t1-accent-green)]/40 text-[var(--t1-accent-green)] text-xs font-bold hover:bg-[var(--t1-accent-green)]/30 transition-colors">
                Send via Email
              </a>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-[var(--t1-text-muted)]">
              Help improve T1. Feedback goes to{' '}
              <a href="mailto:mudityadev@gmail.com" className="text-[var(--t1-accent-cyan)] hover:underline">
                mudityadev@gmail.com
              </a>{' '}
              and is stored in Supabase.
            </p>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email (optional)"
              className="w-full bg-[var(--t1-bg-primary)] border border-[var(--t1-border)] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--t1-border-glow)] placeholder:text-[var(--t1-text-muted)] transition-colors font-mono"
            />

            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Bug report, feature request, or just a note…"
              rows={4}
              className="w-full bg-[var(--t1-bg-primary)] border border-[var(--t1-border)] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--t1-border-glow)] placeholder:text-[var(--t1-text-muted)] transition-colors font-mono resize-none"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleSend}
                disabled={!message.trim() || status === 'sending'}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--t1-accent-green)]/20 border border-[var(--t1-accent-green)]/40 text-[var(--t1-accent-green)] text-sm font-bold hover:bg-[var(--t1-accent-green)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'sending' ? (
                  <><Loader2 size={12} className="animate-spin" /> Sending…</>
                ) : (
                  <><Send size={12} /> Send Feedback</>
                )}
              </button>
              <a
                href={`mailto:mudityadev@gmail.com?subject=T1 Feedback&body=${encodeURIComponent(message)}`}
                className="px-3 py-2 rounded-lg glass border border-[var(--t1-border)] text-xs text-[var(--t1-text-muted)] hover:text-white transition-colors"
                title="Open in email client"
              >
                <Mail size={12} />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
