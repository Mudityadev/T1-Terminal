/**
 * Supabase helpers for saved news items.
 * Table: t1_saved_news
 *
 * All functions silently swallow errors (including 404 when the table doesn't
 * exist yet) and return safe empty values so the UI keeps working.
 */
import { supabase } from '@/lib/supabase';

export interface SavedNewsRow {
  id?: number;
  user_id: string;
  headline: string;
  source: string;
  category: string;
  urgency: string;
  link: string | null;
  region: string | null;
  ticker: string | null;
  saved_at?: string;
}

export async function saveNewsItem(item: Omit<SavedNewsRow, 'id' | 'saved_at'>): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('t1_saved_news').insert(item);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

export async function unsaveNewsItem(userId: string, headline: string): Promise<void> {
  try {
    await supabase.from('t1_saved_news')
      .delete()
      .eq('user_id', userId)
      .eq('headline', headline.slice(0, 200));
  } catch { /* silently ignore */ }
}

export async function fetchSavedNews(userId: string): Promise<SavedNewsRow[]> {
  try {
    const { data, error } = await supabase
      .from('t1_saved_news')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function fetchSavedHeadlines(userId: string): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('t1_saved_news')
      .select('headline')
      .eq('user_id', userId);
    if (error) return new Set();
    return new Set((data ?? []).map(r => r.headline));
  } catch {
    return new Set();
  }
}
