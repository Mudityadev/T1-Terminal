'use client';

import { useEffect, useState } from 'react';
import { startHFTEngine, stopHFTEngine } from '@/lib/hft-engine'
import { trackVisit } from '@/lib/analytics'
import CommandBar from '@/components/CommandBar'
import NewsFeed from '@/components/NewsFeed'
import StatusBar from '@/components/StatusBar'
import UnderConstructionToast from '@/components/UnderConstructionToast'
import FlashAlertBanner from '@/components/FlashAlertBanner'
import FeedbackModal from '@/components/FeedbackModal'

export default function Home() {
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  useEffect(() => {
    startHFTEngine()
    trackVisit()
    return () => stopHFTEngine()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[var(--t1-bg-primary)] relative grid-pattern scan-line">
      {/* Top command bar */}
      <header className="shrink-0 z-40">
        <CommandBar />
      </header>

      {/* Main content — LIVE INTELLIGENCE focus */}
      <main className="flex-1 w-full flex">
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-2 sm:px-3 md:px-4 lg:px-6 py-2 md:py-3">
          <section className="flex-1 min-h-[260px] glass rounded-lg border border-[var(--t1-border)] overflow-hidden flex flex-col">
            <NewsFeed />
          </section>
        </div>
      </main>

      {/* Bottom status bar */}
      <footer className="shrink-0 z-40">
        <StatusBar onFeedback={() => setFeedbackOpen(true)} />
      </footer>

      {/* Global overlays */}
      <UnderConstructionToast />
      <FlashAlertBanner />
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  )
}
