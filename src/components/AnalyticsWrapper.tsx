'use client';

import { useEffect, useRef } from 'react';

export default function AnalyticsWrapper() {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    // Fire and forget
    fetch('/api/analytics/track', { method: 'POST' }).catch(() => {});
  }, []);

  return null;
}
