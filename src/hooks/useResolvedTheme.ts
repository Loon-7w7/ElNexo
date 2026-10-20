import { useEffect, useState } from 'preact/hooks';
import type { Theme } from '../lib/config';

/** Convierte "system" en "dark" o "light" según el sistema operativo. */
export function useResolvedTheme(theme: Theme): 'dark' | 'light' {
  const [prefersLight, setPrefersLight] = useState(() => window.matchMedia('(prefers-color-scheme: light)').matches);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e: MediaQueryListEvent) => setPrefersLight(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const resolved = theme === 'system' ? (prefersLight ? 'light' : 'dark') : theme;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  return resolved;
}
