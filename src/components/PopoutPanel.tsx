import { ExternalLink, LoaderCircle, Maximize2, Minimize2, RotateCw, X } from 'lucide-preact';
import { useMemo, useState } from 'preact/hooks';
import { isSafeUrl, type PopoutSource } from '../lib/config';
import { resolvePopout } from '../lib/embeds';

/**
 * Permisos de cada iframe: todo lo que un chat necesita (scripts, sus cookies, formularios,
 * popups de login) pero sin poder navegar la pestaña principal (evita redirigir a un login falso).
 * allow-scripts + allow-same-origin es seguro aquí porque isSafeUrl rechaza el propio dominio.
 */
const FRAME_SANDBOX = [
  'allow-scripts',
  'allow-same-origin',
  'allow-forms',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-modals',
  'allow-presentation',
  'allow-storage-access-by-user-activation',
].join(' ');

/** Dominio real del popout: el nombre lo elige quien arma el enlace, el dominio no se puede falsear. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

interface Props {
  source: PopoutSource;
  theme: 'dark' | 'light';
  maximized: boolean;
  /** Posición en el grid, para escalonar la animación de entrada. */
  index: number;
  onToggleMax: () => void;
  onRemove: () => void;
}

/** Un popout dentro del grid: barra con acciones y el iframe. */
export function PopoutPanel({ source, theme, maximized, index, onToggleMax, onRemove }: Props) {
  // Cambiar la key del iframe lo vuelve a cargar desde cero.
  const [reload, setReload] = useState(0);
  const { src } = useMemo(() => resolvePopout(source.url, theme), [source.url, theme]);
  // Se guarda qué versión terminó de cargar: si cambia el src o se recarga, vuelve el indicador.
  const frameKey = `${reload}:${src}`;
  const [loadedKey, setLoadedKey] = useState('');
  const loading = loadedKey !== frameKey;
  const host = hostOf(source.url);

  // Defensa extra: el grid ya filtra las URLs, pero este componente no confía en quien lo usa.
  if (!isSafeUrl(source.url)) return null;

  return (
    <section
      className={`panel${maximized ? ' is-max' : ''}`}
      aria-label={source.name}
      aria-busy={loading}
      style={{ '--i': String(index) }}
    >
      <header className="panel-head">
        <span className={`dot square${loading ? ' pulse' : ''}`} style={{ background: source.color }} />
        <span className="panel-name" title={source.url}>
          {source.name}
          {host && host !== source.name && <span className="panel-host">{host}</span>}
        </span>
        <div className="panel-actions">
          <button type="button" className="icon-btn tiny" aria-label="Recargar" title="Recargar" onClick={() => setReload((r) => r + 1)}>
            <RotateCw key={reload} size={14} class={reload ? 'spin-once' : undefined} />
          </button>
          <a
            className="icon-btn tiny"
            href={source.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Abrir en otra ventana"
            title="¿No carga? Ábrelo en otra ventana"
          >
            <ExternalLink size={14} />
          </a>
          <button
            type="button"
            className="icon-btn tiny"
            aria-label={maximized ? 'Restaurar' : 'Maximizar'}
            title={maximized ? 'Restaurar (Esc)' : 'Maximizar'}
            onClick={onToggleMax}
          >
            {maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button type="button" className="icon-btn tiny danger" aria-label={`Quitar ${source.name}`} title="Quitar" onClick={onRemove}>
            <X size={14} />
          </button>
        </div>
      </header>
      <div className="panel-body">
        <iframe
          key={frameKey}
          className="panel-frame"
          src={src}
          title={`Chat de ${source.name}`}
          referrerPolicy="strict-origin-when-cross-origin"
          // En pantallas angostas, los paneles que están fuera de vista cargan al acercarse.
          loading="lazy"
          allow="clipboard-write; autoplay; fullscreen"
          sandbox={FRAME_SANDBOX}
          onLoad={() => setLoadedKey(frameKey)}
        />
        <div className={`panel-loading${loading ? '' : ' done'}`} aria-hidden="true">
          <LoaderCircle size={22} class="spin" />
          <span>Cargando {source.name}…</span>
        </div>
      </div>
    </section>
  );
}
