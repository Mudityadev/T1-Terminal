/**
 * GET /api/admin/users
 * Returns all Supabase auth users using the service-role key.
 * Only callable server-side — service_role key is never exposed to the browser.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ users: [], error: 'service_role_key_missing' }, { status: 200 });
  }

  // Admin client — uses service role key, never sent to browser
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await adminClient.auth.admin.listUsers();

  if (error) {
    console.error('[T1 Admin] listUsers error:', error.message);
    return NextResponse.json({ users: [], error: error.message }, { status: 200 });
  }

  // Return only safe fields — never return password hashes etc.
  const users = (data?.users ?? []).map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    email_confirmed_at: u.email_confirmed_at,
  }));

  return NextResponse.json({ users });
}
