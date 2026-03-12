/**
 * Supabase helpers for saved news items.
 * Table: t1_saved_news
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
  const { error } = await supabase.from('t1_saved_news').insert(item);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function unsaveNewsItem(userId: string, headline: string): Promise<void> {
  await supabase.from('t1_saved_news')
    .delete()
    .eq('user_id', userId)
    .eq('headline', headline.slice(0, 200));
}

export async function fetchSavedNews(userId: string): Promise<SavedNewsRow[]> {
  const { data, error } = await supabase
    .from('t1_saved_news')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function fetchSavedHeadlines(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('t1_saved_news')
    .select('headline')
    .eq('user_id', userId);
  return new Set((data ?? []).map(r => r.headline));
}
