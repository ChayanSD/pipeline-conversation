'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

type Theme = {
  primary: string;
  secondary: string;
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_THEME: Theme = {
  primary: '#2E3F50',
  secondary: '#456987',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return JSON.parse(saved) as Theme;
    } catch {}
    return DEFAULT_THEME;
  });

  // Save theme to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('theme', JSON.stringify(theme));
    } catch {}
  }, [theme]);

  // Fetch theme from API and update
  useEffect(() => {
    let isMounted = true;
    const fetchTheme = async () => {
      try {
        const res = await fetch('/api/theme', { cache: 'no-store' });
        if (!res.ok) return; // keep defaults silently
        const data = await res.json();
        const next: Theme = {
          primary: data?.primary || DEFAULT_THEME.primary,
          secondary: data?.secondary || DEFAULT_THEME.secondary,
        };
        if (isMounted) setTheme(next);
      } catch {
        // ignore errors, keep default theme
      }
    };
    fetchTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}


