import { ExternalLink, LayoutGrid, SlidersHorizontal } from 'lucide-preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { LoginBanner } from '../components/LoginNotice';
import { PopoutPanel } from '../components/PopoutPanel';
import { Logo, SiteFooter } from '../components/ui';
import { useResolvedTheme } from '../hooks/useResolvedTheme';
import { APP_NAME } from '../lib/brand';
import { loadLastConfig, saveLastConfig, STORAGE_KEY, type PopoutSource } from '../lib/config';
import { followLink } from '../lib/router';

/** Keys estables: quitar un panel no recarga los demás. */
function withKeys(sources: PopoutSource[]) {
  const seen = new Map<string, number>();
  return sources.map((source) => {
    const n = seen.get(source.url) ?? 0;
    seen.set(source.url, n + 1);
    return { key: `${source.url}#${n}`, source };
  });
}

export function GridView() {
  const [config, setConfig] = useState(loadLastConfig);
  const theme = useResolvedTheme(config.theme);
  const allPanels = useMemo(() => withKeys(config.sources), [config.sources]);
  // Los desactivados no se cargan, pero se conservan al quitar otro chat.
  const panels = useMemo(() => allPanels.filter((p) => p.source.enabled), [allPanels]);
  const [maximized, setMaximized] = useState<string | null>(null);
  const activeMax = panels.some((p) => p.key === maximized) ? maximized : null;

  // Si se editan los popouts en otra pestaña (el configurador), el grid se actualiza solo.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setConfig(loadLastConfig());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!activeMax) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMaximized(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeMax]);

  const remove = (key: string) => {
    const next = { ...config, sources: allPanels.filter((p) => p.key !== key).map((p) => p.source) };
    saveLastConfig(next);
    setConfig(next);
  };

  if (panels.length === 0) {
    return (
      <div className="grid-shell">
        <div className="empty-setup rise">
          <span className="empty-icon">
            <LayoutGrid size={28} />
          </span>
          <h1>{allPanels.length === 0 ? 'No hay chats configurados' : 'No hay chats activos'}</h1>
          <p>
            {allPanels.length === 0
              ? 'Agrega al menos un chat para empezar.'
              : 'Activa al menos un chat en el configurador para verlo aquí.'}
          </p>
          <a className="btn primary" href="/" onClick={followLink}>
            <SlidersHorizontal size={16} /> Ir al configurador
          </a>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="grid-shell">
      <header className="grid-header">
        <div className="brand-small">
          <Logo size={24} />
          <div>
            <div className="brand-name">{APP_NAME}</div>
            <div className="brand-sub">
              {panels.length} chat{panels.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
        <p className="grid-hint">
          ¿Alguno no carga? Usa <ExternalLink size={12} /> para abrirlo aparte.
        </p>
        <a className="icon-btn" href="/" onClick={followLink} aria-label="Editar configuración" title="Editar configuración">
          <SlidersHorizontal size={18} />
        </a>
      </header>

      <LoginBanner />

      <main className={`popout-grid${activeMax ? ' has-max' : ''}`} data-count={panels.length}>
        {panels.map(({ key, source }, i) => (
          <PopoutPanel
            key={key}
            index={i}
            source={source}
            theme={theme}
            maximized={activeMax === key}
            onToggleMax={() => setMaximized(activeMax === key ? null : key)}
            onRemove={() => remove(key)}
          />
        ))}
      </main>

      <SiteFooter />
    </div>
  );
}
