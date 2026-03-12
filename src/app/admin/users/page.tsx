import { createClient } from '@supabase/supabase-js'
import { CheckCircle, Search } from 'lucide-react'
import UserListClient from './ClientList'
import BulkCreateTool from './BulkCreate'

// Use service role key to manage all users safely on the server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const users = data?.users || []

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">User Intelligence</h1>
          <p className="text-xs text-[var(--t1-text-muted)] font-mono mt-1">
            Global T1 Terminal operators. Total: {users.length}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Main List */}
        <div className="lg:col-span-2 glass rounded-xl border border-[var(--t1-border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--t1-border)] bg-[var(--t1-bg-tertiary)] grid grid-cols-[minmax(0,1fr)_auto_auto] gap-4 text-[10px] font-mono uppercase text-[var(--t1-text-muted)] tracking-wider">
            <span>Identity</span>
            <span className="hidden sm:block">First Seen</span>
            <span>Status</span>
          </div>
          <UserListClient users={users} />
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-1">
          <BulkCreateTool />
        </div>
      </div>
    </div>
  )
}
