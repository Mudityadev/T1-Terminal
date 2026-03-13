'use client';

import { useEffect, useState, useRef } from 'react';
import { Search, Terminal, X, ChevronRight } from 'lucide-react';
import { useMarketStore } from '@/store/market-store';
import { useTheme } from '@/components/ThemeProvider';

const COMMANDS = [
  { cmd: 'TOP', desc: 'Market Overview' },
  { cmd: 'NEWS', desc: 'News & Intelligence Feed' },
  { cmd: 'CHART', desc: 'Price Chart' },
  { cmd: 'PORT', desc: 'Portfolio Analysis' },
  { cmd: 'FX', desc: 'Foreign Exchange' },
  { cmd: 'CMDTY', desc: 'Commodities' },
  { cmd: 'ECO', desc: 'Economic Calendar' },
  { cmd: 'GOVT', desc: 'Government Bonds' },
  { cmd: 'THEME MATRIX', desc: 'Apply Phosphor Green Theme' },
  { cmd: 'THEME AMBER', desc: 'Apply Retro Amber Theme' },
  { cmd: 'THEME DEFAULT', desc: 'Apply Default Dark Theme' },
];

export default function CommandBar() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { watchlist, setSelectedSymbol } = useMarketStore();
  const { setTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setFocused(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredCommands = COMMANDS.filter(c =>
    c.cmd.toLowerCase().includes(query.toLowerCase()) ||
    c.desc.toLowerCase().includes(query.toLowerCase())
  );

  const filteredSymbols = query.length > 0
    ? watchlist.filter(w =>
        w.symbol.toLowerCase().includes(query.toLowerCase()) ||
        w.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="relative z-50">
      {/* Command Bar */}
      <div className="flex items-center h-11 sm:h-10 glass border-b border-[var(--t1-border)]">

        {/* T1 Logo — fixed width, never shrinks */}
        <div className="flex items-center gap-2 px-3 border-r border-[var(--t1-border)] h-full shrink-0">
          <Terminal size={14} className="text-[var(--t1-accent-green)]" />
          <span className="text-xs font-bold tracking-widest text-[var(--t1-accent-green)] text-glow-green">T1</span>
        </div>

        {/* Search area — takes remaining space, icon inside, no overlap */}
        <div className="flex-1 flex items-center min-w-0 px-2 sm:px-3 gap-1.5 sm:gap-2">
          <Search size={13} className="shrink-0 text-[var(--t1-text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder="Search ticker, function, or type command…"
            className="flex-1 min-w-0 bg-transparent text-[13px] sm:text-sm text-[var(--t1-text-primary)] placeholder:text-[var(--t1-text-muted)] outline-none font-mono"
          />
          <div className="hidden sm:flex shrink-0 items-center gap-1 text-[10px] text-[var(--t1-text-muted)] font-mono">
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--t1-bg-tertiary)] border border-[var(--t1-border)]">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--t1-bg-tertiary)] border border-[var(--t1-border)]">K</kbd>
          </div>
        </div>

        {query && (
          <button onClick={() => setQuery('')} className="shrink-0 px-3 text-[var(--t1-text-muted)] hover:text-[var(--t1-text-primary)]">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {focused && (query.length > 0 || true) && (
        <div className="absolute top-10 left-0 right-0 glass border border-[var(--t1-border)] shadow-2xl max-h-80 overflow-y-auto animate-fade-in-up">
          {/* Symbols */}
          {filteredSymbols.length > 0 && (
            <div className="p-2">
              <div className="text-[10px] font-bold text-[var(--t1-text-muted)] tracking-widest px-2 py-1">SECURITIES</div>
              {filteredSymbols.map(s => (
                <button
                  key={s.symbol}
                  onClick={() => { setSelectedSymbol(s.symbol); setQuery(''); }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[var(--t1-bg-tertiary)] transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--t1-accent-cyan)] font-mono">{s.symbol}</span>
                    <span className="text-xs text-[var(--t1-text-secondary)]">{s.name}</span>
                  </div>
                  <ChevronRight size={12} className="text-[var(--t1-text-muted)]" />
                </button>
              ))}
            </div>
          )}

          {/* Commands */}
          <div className="p-2 border-t border-[var(--t1-border)]">
            <div className="text-[10px] font-bold text-[var(--t1-text-muted)] tracking-widest px-2 py-1">FUNCTIONS</div>
            {filteredCommands.map(c => (
              <button
                key={c.cmd}
                onClick={() => {
                  if (c.cmd === 'THEME MATRIX') setTheme('matrix');
                  else if (c.cmd === 'THEME AMBER') setTheme('amber');
                  else if (c.cmd === 'THEME DEFAULT') setTheme('default');
                  setQuery('');
                  setFocused(false);
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[var(--t1-bg-tertiary)] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--t1-accent-amber)] font-mono w-12">{c.cmd}</span>
                  <span className="text-xs text-[var(--t1-text-secondary)]">{c.desc}</span>
                </div>
                <span className="text-[10px] text-[var(--t1-text-muted)] font-mono">&lt;GO&gt;</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
