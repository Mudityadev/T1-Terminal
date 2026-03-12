import { fetchFeedback } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function FeedbackPage() {
  const feedbacks = await fetchFeedback()

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Intelligence Intel Flow</h1>
          <p className="text-xs text-[var(--t1-text-muted)] font-mono mt-1">
            Raw operator transmissions. Total: {feedbacks.length}
          </p>
        </div>
      </div>

      <div className="glass rounded-xl border border-[var(--t1-border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--t1-border)] bg-[var(--t1-bg-tertiary)] flex justify-between">
          <span className="text-sm font-bold text-white">Transmissions</span>
          <span className="text-[10px] text-[var(--t1-text-muted)] font-mono uppercase tracking-widest">{feedbacks.length} ENTRIES</span>
        </div>
        
        <div className="divide-y divide-[var(--t1-border)]">
          {feedbacks.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-[var(--t1-text-muted)] font-mono">
              No intelligence transmissions received yet.
            </div>
          ) : (
            feedbacks.map((fb, i) => (
              <div key={i} className="px-5 py-4 hover:bg-[var(--t1-bg-tertiary)] transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {fb.email ? (
                      <a href={`mailto:${fb.email}`} className="text-xs text-[var(--t1-accent-cyan)] font-mono hover:underline truncate max-w-[200px] sm:max-w-xs">
                        {fb.email}
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--t1-text-muted)] font-mono">Anonymous Source</span>
                    )}
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-[var(--t1-border)] text-[var(--t1-text-muted)] font-mono">
                      {fb.user_agent ? 'WEB CLI' : 'UNKNOWN'}
                    </span>
                  </div>
                  
                  <span className="text-[10px] text-[var(--t1-text-muted)] font-mono whitespace-nowrap">
                    {fb.created_at ? new Date(fb.created_at).toLocaleString() : ''}
                  </span>
                </div>
                
                <div className="mt-3 text-sm text-[var(--t1-text-secondary)] leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-[var(--t1-border)] group-hover:border-[var(--t1-border-glow)] transition-colors">
                  {fb.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
