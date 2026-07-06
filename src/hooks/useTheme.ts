import { useCallback, useEffect, useState } from 'react';
import type { Theme } from '../types';

const STORAGE_KEY = 'hemato_theme';

function readTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'day';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'night' || stored === 'exam' ? stored : 'day';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') {
    return;
  }

  document.body.classList.remove('night', 'exam');

  if (theme === 'night') {
    document.body.classList.add('night');
  } else if (theme === 'exam') {
    document.body.classList.add('exam');
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readTheme());

  useEffect(() => {
    applyTheme(theme);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  return { theme, setTheme };
}
