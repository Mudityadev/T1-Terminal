import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const hasVisited = cookieStore.get('t1_visited');

    const isUnique = !hasVisited;

    if (isUnique) {
      cookieStore.set('t1_visited', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
      });
    }

    const { error } = await supabase.rpc('increment_analytics', {
      is_unique: isUnique,
    });

    if (error) {
      console.error('Analytics error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, isUnique });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
