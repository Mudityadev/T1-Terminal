import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Only create client if both URL and key are provided
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null;

export const supabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url'
);

// ===== TYPES =====
export type FeedbackRow = {
  id?: number;
  email: string | null;
  message: string;
  created_at?: string;
  user_agent?: string;
};

// ===== ERROR LOGGER =====
function logError(label: string, error: unknown) {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    console.error(`[T1] ${label}:`, 'message:', e.message, '| code:', e.code, '| details:', e.details, '| hint:', e.hint);
  } else {
    console.error(`[T1] ${label}:`, error);
  }
}

// ===== FEEDBACK =====
export async function insertFeedback(email: string, message: string): Promise<{ ok: boolean; message?: string }> {
  if (!supabaseConfigured || !supabase) return { ok: false, message: 'not_configured' };
  const { error } = await supabase.from('t1_feedback').insert({
    email: email || null,
    message,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });
  if (error) { logError('Supabase insert error', error); return { ok: false, message: (error as { message?: string }).message }; }
  return { ok: true };
}

export async function fetchFeedback(): Promise<FeedbackRow[]> {
  if (!supabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from('t1_feedback').select('*').order('created_at', { ascending: false });
  if (error) { logError('Supabase fetch error', error); return []; }
  return data ?? [];
}

// ===== ANALYTICS =====
export async function fetchAnalytics() {
  if (!supabaseConfigured || !supabase) return { page_views: 0, unique_visits: 0, last_visit: '' };
  const { data, error } = await supabase.from('t1_analytics').select('*').eq('id', 1).single();
  if (error) { logError('Supabase analytics fetch error', error); return { page_views: 0, unique_visits: 0, last_visit: '' }; }
  return data;
}

// ===== AUTH =====
export async function signIn(email: string, password: string) {
  if (!supabase) return { user: null, session: null, error: new Error('Supabase not configured') };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user ?? null, session: data?.session ?? null, error };
}

export async function signUp(email: string, password: string) {
  if (!supabase) return { user: null, session: null, error: new Error('Supabase not configured') };
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data?.user ?? null, session: data?.session ?? null, error };
}

export async function signOut() {
  if (!supabase) return { error: new Error('Supabase not configured') };
  return supabase.auth.signOut();
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}
