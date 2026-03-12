/**
 * POST /api/admin/create-users
 * Bulk creates users in Supabase Auth using service role key.
 * Body: { prefix, domain, count, passwordLength }
 * Returns: array of { email, password } — shown once to admin for distribution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl || serviceKey === 'your_service_role_key_here') {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const prefix = (body.prefix as string) || 't1user';
  const domain = (body.domain as string) || 't1terminal.app';
  const count = Math.min(Math.max(parseInt(body.count ?? '100'), 1), 200);
  const passwordLength = Math.max(parseInt(body.passwordLength ?? '10'), 8);

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const created: { email: string; password: string; status: string }[] = [];
  const failed: { email: string; error: string }[] = [];

  // Create users sequentially to avoid rate limits
  for (let i = 1; i <= count; i++) {
    const email = `${prefix}${String(i).padStart(3, '0')}@${domain}`;
    const password = generatePassword(passwordLength);

    try {
      const { error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirm email automatically — no confirmation email needed
      });

      if (error) {
        // If user already exists, record as skipped
        failed.push({ email, error: error.message });
      } else {
        created.push({ email, password, status: 'created' });
      }
    } catch (err) {
      failed.push({ email, error: String(err) });
    }

    // Small delay every 10 users to avoid API rate limits
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 300));
  }

  return NextResponse.json({ created, failed, total: count, createdCount: created.length, failedCount: failed.length });
}
