'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'default' | 'matrix' | 'amber';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyThemeToBody = (activeTheme: Theme) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('theme-matrix', 'theme-amber');
  if (activeTheme !== 'default') {
    document.documentElement.classList.add(`theme-${activeTheme}`);
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check local storage on mount (client-side only)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('t1_theme') as Theme;
      if (savedTheme && ['default', 'matrix', 'amber'].includes(savedTheme)) {
        setThemeState(savedTheme);
        applyThemeToBody(savedTheme);
      }
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('t1_theme', newTheme);
    }
    applyThemeToBody(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
