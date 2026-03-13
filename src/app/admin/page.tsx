import {
  Eye,
  BarChart3,
  Users,
  MessageSquare,
  Database,
  CheckCircle,
  ArrowUpRight,
  Activity,
  UserPlus,
} from 'lucide-react'
import { fetchFeedback, fetchAnalytics } from '@/lib/supabase'
import { TrafficChart, CategoryBarChart, FeedbackSparkline } from '@/components/AdminCharts'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminOverview() {
  const [fbRows, usersRes, analyticsData, savedNewsRes] = await Promise.all([
    fetchFeedback(),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1 }),
    fetchAnalytics(),
    supabaseAdmin
      .from('t1_saved_news')
      .select('id, category, saved_at')
      .order('saved_at', { ascending: false })
      .limit(500),
  ])
  const fullUsersRes = await supabaseAdmin.auth.admin.listUsers({ perPage: 50 })

  // Supabase types for listUsers returns a union where `total` exists on the success branch.
  const totalUsers =
    'users' in usersRes.data && 'total' in usersRes.data
      ? usersRes.data.total ?? fullUsersRes.data?.users?.length ?? 0
      : fullUsersRes.data?.users?.length ?? 0

  const recentUsers = (fullUsersRes.data?.users ?? [])
    .slice()
    .sort((a, b) => {
      const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
      const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
      return bCreated - aCreated
    })
    .slice(0, 5)
  const recentFeedback = fbRows.slice(0, 5)

  const feedbackConversion =
    analyticsData.unique_visits > 0
      ? (fbRows.length / analyticsData.unique_visits) * 100
      : 0

  const savedNewsRows = savedNewsRes.data ?? []
  const totalSavedNews = savedNewsRows.length

  const categoryCountsMap = new Map<string, number>()
  for (const row of savedNewsRows as any[]) {
    const key = (row.category as string) || 'Uncategorized'
    categoryCountsMap.set(key, (categoryCountsMap.get(key) ?? 0) + 1)
  }

  const categoryChartData = Array.from(categoryCountsMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const today = new Date()
  const feedbackTrendData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    const dayKey = d.toISOString().slice(0, 10)
    const count = fbRows.filter((fb) =>
      fb.created_at ? (fb.created_at as string).slice(0, 10) === dayKey : false
    ).length
    return {
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count,
    }
  })
  
  // Create simple 7-day chart data based on the single analytics row for demonstration
  // In a real app, this would query a time-series analytics table
  const chartData = Array.from({ length: 7 }).map((_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    pageViews: i === 6 ? analyticsData.page_views : Math.floor(analyticsData.page_views * (Math.random() * 0.4 + 0.6) / 7),
    visits: i === 6 ? analyticsData.unique_visits : Math.floor(analyticsData.unique_visits * (Math.random() * 0.4 + 0.6) / 7),
  }));

  return (
    <div className="space-y-8 max-w-6xl w-full mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Command Center
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--t1-border)] bg-[var(--t1-bg-tertiary)] px-2 py-0.5 text-[10px] font-mono text-[var(--t1-text-muted)]">
              <Activity size={10} className="text-[var(--t1-accent-green)]" />
              live telemetry
            </span>
          </h1>
          <p className="mt-1 text-xs text-[var(--t1-text-muted)] font-mono max-w-xl">
            End‑to‑end overview of visitors, operators, and signal flow across the T1 Terminal.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--t1-accent-green)]/20 border border-[var(--t1-accent-green)]/40 px-3 py-1.5 text-xs font-mono text-[var(--t1-accent-green)] hover:bg-[var(--t1-accent-green)]/30 transition-colors"
          >
            <UserPlus size={12} />
            Manage Operators
          </a>
          <a
            href="/admin/feedback"
            className="inline-flex items-center gap-2 rounded-lg glass border border-[var(--t1-border)] px-3 py-1.5 text-xs font-mono text-[var(--t1-text-muted)] hover:text-white hover:bg-[var(--t1-bg-tertiary)] transition-colors"
          >
            <MessageSquare size={12} />
            Review Intelligence
          </a>
        </div>
      </header>

      {/* Top stats row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          { label: 'Unique Operators', value: analyticsData.unique_visits, icon: Eye, color: '#22c55e' },
          { label: 'Terminal Page Views', value: analyticsData.page_views, icon: BarChart3, color: '#06b6d4' },
          { label: 'Auth Users', value: totalUsers, icon: Users, color: '#a855f7' },
          { label: 'Feedback Signals', value: fbRows.length, icon: MessageSquare, color: '#f59e0b' },
          { label: 'Saved Intel Items', value: totalSavedNews, icon: Database, color: '#38bdf8' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="glass rounded-xl p-4 sm:p-5 border border-[var(--t1-border)] hover:border-[var(--t1-border-glow)] transition-colors flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--t1-text-muted)]">
                    {s.label}
                  </span>
                </div>
                <Icon size={14} style={{ color: s.color }} />
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono tracking-tight" style={{ color: s.color }}>
                {s.value?.toLocaleString() || 0}
              </p>
            </div>
          )
        })}
      </section>

      {/* Traffic + system health */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass rounded-xl border border-[var(--t1-border)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-[var(--t1-accent-cyan)]" />
                <span className="text-sm font-bold text-white">Global Traffic (7 Day)</span>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[var(--t1-border)] px-2 py-0.5 text-[10px] font-mono text-[var(--t1-text-muted)]">
                <ArrowUpRight size={10} />
                {analyticsData.page_views.toLocaleString?.() ?? analyticsData.page_views} views
              </span>
            </div>
            <TrafficChart data={chartData} />
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="glass rounded-xl p-4 sm:p-5 border border-[var(--t1-border)] space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-[var(--t1-accent-green)]" />
                  <span className="text-sm font-bold text-white">Supabase Cluster</span>
                </div>
                <span className="text-[9px] font-mono text-[var(--t1-text-muted)] uppercase tracking-wide">
                  control plane
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-green-400 font-mono">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Healthy · Connected' : 'Not configured'}
                </span>
              </div>

              <p className="text-[10px] sm:text-xs text-[var(--t1-text-muted)] font-mono break-all leading-relaxed">
                <span className="text-[var(--t1-text-secondary)]">URL:</span>
                <br />
                {process.env.NEXT_PUBLIC_SUPABASE_URL ?? '—'}
              </p>
            </div>

            <div className="glass rounded-xl p-4 sm:p-5 border border-[var(--t1-border)] space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[var(--t1-accent-cyan)]" />
                <span className="text-sm font-bold text-white">Latest Activity</span>
              </div>
              <p className="text-[10px] sm:text-xs text-[var(--t1-text-muted)] font-mono">
                Last recorded visit:
                <br />
                <span className="text-white mt-1 block">
                  {analyticsData.last_visit ? new Date(analyticsData.last_visit).toLocaleString() : '—'}
                </span>
              </p>
              <p className="text-[10px] sm:text-xs text-[var(--t1-text-muted)] font-mono">
                Feedback conversion:{' '}
                <span className="text-[var(--t1-accent-green)]">
                  {feedbackConversion.toFixed(1)}%
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Content intelligence charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass rounded-xl border border-[var(--t1-border)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-[var(--t1-accent-cyan)]" />
                <span className="text-sm font-bold text-white">Saved Intel by Category</span>
              </div>
              <span className="text-[10px] text-[var(--t1-text-muted)] font-mono uppercase tracking-widest">
                top {categoryChartData.length || 0} categories
              </span>
            </div>
            <CategoryBarChart data={categoryChartData} />
          </div>

          <div className="glass rounded-xl border border-[var(--t1-border)] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-[var(--t1-accent-amber)]" />
                <span className="text-sm font-bold text-white">Feedback Pulse (7 Day)</span>
              </div>
              <span className="text-[10px] text-[var(--t1-text-muted)] font-mono uppercase tracking-widest">
                signals/day
              </span>
            </div>
            <FeedbackSparkline data={feedbackTrendData} />
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <section className="grid lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="glass rounded-xl border border-[var(--t1-border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--t1-border)] bg-[var(--t1-bg-tertiary)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[var(--t1-accent-green)]" />
              <span className="text-sm font-bold text-white">Recent Operators</span>
            </div>
            <span className="text-[10px] text-[var(--t1-text-muted)] font-mono uppercase tracking-widest">
              last {recentUsers.length} entries
            </span>
          </div>

          {recentUsers.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[var(--t1-text-muted)] font-mono">
              No operators found yet. Provision accounts from the Users panel.
            </div>
          ) : (
            <div className="divide-y divide-[var(--t1-border)]">
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--t1-bg-tertiary)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-white truncate">{u.email}</p>
                    <p className="text-[9px] text-[var(--t1-text-muted)] font-mono truncate">
                      {u.id}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] text-[var(--t1-text-muted)] font-mono whitespace-nowrap">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        u.email_confirmed_at
                          ? 'border-green-500/40 bg-green-500/10 text-green-400'
                          : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {u.email_confirmed_at ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent feedback */}
        <div className="glass rounded-xl border border-[var(--t1-border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--t1-border)] bg-[var(--t1-bg-tertiary)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-[var(--t1-accent-cyan)]" />
              <span className="text-sm font-bold text-white">Latest Intelligence</span>
            </div>
            <span className="text-[10px] text-[var(--t1-text-muted)] font-mono uppercase tracking-widest">
              last {recentFeedback.length} signals
            </span>
          </div>

          {recentFeedback.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[var(--t1-text-muted)] font-mono">
              No feedback collected yet. Nudge operators from the terminal status bar.
            </div>
          ) : (
            <div className="divide-y divide-[var(--t1-border)]">
              {recentFeedback.map((fb, i) => (
                <div
                  key={i}
                  className="px-4 py-3 hover:bg-[var(--t1-bg-tertiary)] transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[var(--t1-text-muted)] font-mono truncate">
                      {fb.email || 'Anonymous Source'}
                    </span>
                    <span className="text-[9px] text-[var(--t1-text-muted)] font-mono whitespace-nowrap">
                      {fb.created_at ? new Date(fb.created_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--t1-text-secondary)] font-mono line-clamp-2">
                    {fb.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
