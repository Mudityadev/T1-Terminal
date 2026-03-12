/**
 * T1 Terminal — Visitor Tracker
 * Tracks visits and page views in localStorage.
 * Called once on app mount.
 */
export function trackVisit() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('t1_admin_stats');
    const stats = raw ? JSON.parse(raw) : { visits: 0, pageViews: 0, feedbackCount: 0, feedbacks: [], lastVisit: '' };

    // Increment visits once per session
    const lastVisit = sessionStorage.getItem('t1_session');
    if (!lastVisit) {
      stats.visits = (stats.visits || 0) + 1;
      sessionStorage.setItem('t1_session', '1');
    }
    stats.pageViews = (stats.pageViews || 0) + 1;
    stats.lastVisit = new Date().toISOString();
    localStorage.setItem('t1_admin_stats', JSON.stringify(stats));
  } catch {}
}

export function submitFeedback(email: string, message: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('t1_admin_stats');
    const stats = raw ? JSON.parse(raw) : { visits: 0, pageViews: 0, feedbackCount: 0, feedbacks: [], lastVisit: '' };
    stats.feedbackCount = (stats.feedbackCount || 0) + 1;
    stats.feedbacks = [{ email, message, timestamp: new Date().toISOString() }, ...(stats.feedbacks || [])];
    localStorage.setItem('t1_admin_stats', JSON.stringify(stats));
  } catch {}
}
