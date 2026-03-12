'use client';

import { useEffect, useState } from 'react';
import { startHFTEngine, stopHFTEngine } from '@/lib/hft-engine';
import { trackVisit } from '@/lib/analytics';
import CommandBar from '@/components/CommandBar';
import NewsFeed from '@/components/NewsFeed';
import StatusBar from '@/components/StatusBar';
import UnderConstructionToast from '@/components/UnderConstructionToast';
import FlashAlertBanner from '@/components/FlashAlertBanner';
import FeedbackModal from '@/components/FeedbackModal';

export default function Home() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    startHFTEngine();
    trackVisit();
    return () => stopHFTEngine();
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden grid-pattern scan-line relative">
      {/* Command Bar */}
      <CommandBar />

      {/* Main Content — Full-width News Feed */}
      <div className="flex-1 overflow-hidden min-h-0">
        <NewsFeed />
      </div>

      {/* Status Bar */}
      <StatusBar onFeedback={() => setFeedbackOpen(true)} />

      {/* Global Overlays */}
      <UnderConstructionToast />
      <FlashAlertBanner />
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
