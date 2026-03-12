import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  if (!supabaseConfigured) return { ok: false, message: 'not_configured' };
  const { error } = await supabase.from('t1_feedback').insert({
    email: email || null,
    message,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });
  if (error) { logError('Supabase insert error', error); return { ok: false, message: (error as { message?: string }).message }; }
  return { ok: true };
}

export async function fetchFeedback(): Promise<FeedbackRow[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await supabase.from('t1_feedback').select('*').order('created_at', { ascending: false });
  if (error) { logError('Supabase fetch error', error); return []; }
  return data ?? [];
}

// ===== AUTH =====
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user ?? null, session: data?.session ?? null, error };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data?.user ?? null, session: data?.session ?? null, error };
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
