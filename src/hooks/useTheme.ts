import { useEffect } from 'react';
import type { ThemePref } from '../types';
import { writePref } from '../utils/safeStorage';

const THEME_COLORS = { light: '#f4f5f7', dark: '#0b0d10' };

/** Applies the theme preference to <html> and keeps the browser UI colour in sync. */
export function useTheme(pref: ThemePref) {
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      if (pref === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', pref);
      const effective = pref === 'system' ? (mq.matches ? 'dark' : 'light') : pref;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[effective]);
    };
    apply();
    writePref('theme', pref);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pref]);
}
