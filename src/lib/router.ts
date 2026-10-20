import { useEffect, useState } from 'preact/hooks';

/**
 * Router mínimo con rutas normales (/ y /grid), sin librerías.
 * En Vercel, vercel.json reescribe cualquier ruta a index.html.
 */

export const ROUTES = ['/', '/grid'] as const;
export type RoutePath = (typeof ROUTES)[number];

/** "/grid/" y "/grid" son la misma ruta. */
export function currentPath(): string {
  return window.location.pathname.replace(/(.)\/+$/, '$1') || '/';
}

export function useRoute(): string {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);
  return path;
}

export function navigate(path: RoutePath, { replace = false } = {}): void {
  window.history[replace ? 'replaceState' : 'pushState'](null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  if (!replace) window.scrollTo(0, 0);
}

/**
 * onClick para enlaces internos: navega sin recargar la página. Respeta Ctrl/Cmd+clic
 * y el botón del medio para abrir en otra pestaña.
 */
export function followLink(e: MouseEvent): void {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const path = (e.currentTarget as HTMLAnchorElement).pathname as RoutePath;
  if (!ROUTES.includes(path)) return;
  e.preventDefault();
  navigate(path);
}
