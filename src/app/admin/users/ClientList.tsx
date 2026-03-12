'use client';

import { useState } from 'react';
import { Trash } from 'lucide-react';
import { deleteUser } from './actions';
import { useRouter } from 'next/navigation';

export default function UserListClient({ users }: { users: any[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you absolutely sure you want to delete ${email}?`)) return;
    
    setDeletingId(id);
    const res = await deleteUser(id);
    setDeletingId(null);
    
    if (res.success) {
      router.refresh();
    } else {
      alert(`Failed to delete: ${res.error}`);
    }
  };

  if (users.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-xs text-[var(--t1-text-muted)] font-mono">
        No operators found. Ensure SUPABASE_SERVICE_ROLE_KEY is set.
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--t1-border)]">
      {users.map((u) => (
        <div key={u.id} className="px-4 py-3 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-4 items-center hover:bg-[var(--t1-bg-tertiary)] transition-colors">
          <div className="min-w-0">
            <p className="text-xs font-mono text-white truncate">{u.email}</p>
            <p className="text-[9px] text-[var(--t1-text-muted)] font-mono mt-0.5 truncate">
              ID: {u.id}
            </p>
          </div>
          
          <span className="hidden sm:block text-[10px] text-[var(--t1-text-muted)] font-mono whitespace-nowrap">
            {new Date(u.created_at).toLocaleDateString()}
          </span>
          
          <div className="flex gap-3 items-center">
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap ${
              u.email_confirmed_at 
                ? 'border-green-500/40 bg-green-500/10 text-green-400' 
                : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
            }`}>
              {u.email_confirmed_at ? 'VERIFIED' : 'PENDING'}
            </span>
            <button 
              onClick={() => handleDelete(u.id, u.email)}
              disabled={deletingId === u.id}
              className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              title="Delete User"
            >
              <Trash size={14} className={deletingId === u.id ? 'animate-pulse' : ''} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
