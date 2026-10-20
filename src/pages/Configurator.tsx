import {
  Check,
  CircleAlert,
  CircleCheck,
  ClipboardPaste,
  Coffee,
  Copy,
  Globe,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Link,
  HardDrive,
  Monitor,
  Moon,
  Palette,
  Plus,
  Share2,
  ShieldCheck,
  Sun,
  Trash,
  WandSparkles,
} from 'lucide-preact';
import type { TargetedSubmitEvent } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { LoginInfoCard } from '../components/LoginNotice';
import { Logo, Segmented, SiteFooter, TagBadge } from '../components/ui';
import { useResolvedTheme } from '../hooks/useResolvedTheme';
import { APP_NAME, DONATE_URL } from '../lib/brand';
import {
  buildShareUrl,
  isSafeUrl,
  loadLastConfig,
  MAX_NAME_LENGTH,
  MAX_SOURCES,
  sanitizeName,
  saveLastConfig,
  type Config,
  type PopoutSource,
} from '../lib/config';
import { KNOWN_PLATFORMS, resolvePopout, suggestSource } from '../lib/embeds';
import { followLink } from '../lib/router';

/** Acepta links sin "https://" (ej. "kick.com/popout/canal/chat"). */
function normalizeUrl(input: string): string {
  const value = input.trim();
  if (!value || /^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

/** En una pantalla ancha caben unas 4 columnas de 320px. */
const PREVIEW_MAX_COLUMNS = 4;

/** Índice para escalonar animaciones de entrada (ver .rise en themes.css). */
const stagger = (i: number) => ({ '--i': String(i) });

export function Configurator() {
  const [config, setConfig] = useState<Config>(loadLastConfig);
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState('');
  const [copied, setCopied] = useState(false);
  useResolvedTheme(config.theme);

  useEffect(() => saveLastConfig(config), [config]);

  const shareUrl = useMemo(() => buildShareUrl(config), [config]);
  const validSources = config.sources.filter((s) => isSafeUrl(s.url));

  const setSources = (sources: PopoutSource[]) => setConfig((c) => ({ ...c, sources }));

  const addSource = (e: TargetedSubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const url = normalizeUrl(draft);
    if (config.sources.length >= MAX_SOURCES) {
      setDraftError(`Máximo ${MAX_SOURCES} chats por grid. Quita alguno para agregar otro.`);
      return;
    }
    if (!isSafeUrl(url)) {
      setDraftError('Ese link no sirve: debe empezar con https:// y ser de un sitio público.');
      return;
    }
    setSources([...config.sources, suggestSource(url)]);
    setDraft('');
    setDraftError('');
  };

  const updateSource = (index: number, patch: Partial<PopoutSource>) =>
    setSources(config.sources.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  // Si el nombre y el color siguen siendo los sugeridos, se actualizan junto con el link.
  const updateUrl = (index: number, url: string) => {
    const current = config.sources[index];
    const before = suggestSource(current.url);
    const after = suggestSource(url);
    updateSource(index, {
      url,
      name: current.name === before.name ? after.name : current.name,
      color: current.color === before.color ? after.color : current.color,
    });
  };

  const removeSource = (index: number) => setSources(config.sources.filter((_, i) => i !== index));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copia el enlace:', shareUrl);
    }
  };

  const previewColumns = Math.min(Math.max(validSources.length, 1), PREVIEW_MAX_COLUMNS);

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <a href="/" onClick={followLink} className="brand">
              <Logo />
              <span>{APP_NAME}</span>
            </a>
          </div>
          <a className="btn kofi" href={DONATE_URL} target="_blank" rel="noopener noreferrer">
            <Coffee size={16} /> Apóyame en Ko-fi
          </a>
        </div>
      </header>

      <main className="container">
        <div className="page-head">
          <div className="rise" style={stagger(0)}>
            <div className="eyebrow">Nuevo grid</div>
            <h1>Todos tus chats en una pestaña</h1>
            <p className="lede">
              Pega el link del chat de cada plataforma. Se acomodan solos en un grid que se adapta a tu pantalla.
            </p>
          </div>
          <div className="pills rise" style={stagger(1)}>
            <span className="pill">
              <Globe size={13} /> Cualquier plataforma
            </span>
            <span className="pill">
              <ShieldCheck size={13} /> Sin cuentas
            </span>
            <span className="pill">
              <HardDrive size={13} /> Se guarda en tu navegador
            </span>
          </div>
        </div>

        <div className="layout">
          <div className="col-main">
            <section className="card rise" style={stagger(2)}>
              <div className="card-head">
                <div className="card-title">
                  <Layers size={16} class="card-icon" />
                  <h2>Chats</h2>
                  <span key={config.sources.length} className="count bump">
                    {config.sources.length}
                  </span>
                </div>
              </div>

              <form className="add-form" onSubmit={addSource}>
                <label className={`prefixed-input grow${draftError ? ' shake' : ''}`}>
                  <span className="prefix">
                    <Link size={14} />
                  </span>
                  <input
                    aria-label="Link del chat"
                    placeholder="https://www.twitch.tv/popout/canal/chat"
                    value={draft}
                    onInput={(e) => {
                      setDraft(e.currentTarget.value);
                      setDraftError('');
                    }}
                    spellcheck={false}
                  />
                </label>
                <button type="submit" className="btn accent" disabled={!draft.trim()}>
                  <Plus size={16} /> Agregar
                </button>
                {draftError && (
                  <p className="field-error rise">
                    <CircleAlert size={13} /> {draftError}
                  </p>
                )}
              </form>

              {config.sources.length === 0 && (
                <div className="empty-sources rise">
                  <ClipboardPaste size={22} class="empty-sources-icon" />
                  <div>
                    <p>Todavía no hay chats. Algunos ejemplos de links que funcionan:</p>
                    <ul className="mono">
                      <li>twitch.tv/popout/canal/chat</li>
                      <li>youtube.com/live_chat?v=ID_DEL_DIRECTO</li>
                      <li>kick.com/popout/canal/chat</li>
                      <li>…o el chat de cualquier otro sitio</li>
                    </ul>
                  </div>
                </div>
              )}

              {config.sources.map((s, i) => {
                const valid = isSafeUrl(s.url);
                const { platform } = resolvePopout(s.url, 'dark');
                const meta = platform ? KNOWN_PLATFORMS[platform] : null;
                const StatusIcon = !valid ? CircleAlert : meta ? WandSparkles : CircleCheck;
                return (
                  <div className="source-row rise" key={i}>
                    <TagBadge tag={meta?.tag ?? (s.name.slice(0, 2).toUpperCase() || 'CH')} color={s.color} />
                    <div className="source-main">
                      <div className="source-title">
                        <span>{s.name || 'Chat'}</span>
                        <span className={`status status-${valid ? 'connected' : 'error'}`}>
                          <StatusIcon size={13} />
                          {!valid ? 'URL no válida' : meta ? `${meta.label} · adaptado para incrustar` : 'Se carga tal cual'}
                        </span>
                      </div>
                      <div className="custom-fields">
                        <input
                          className="input mono grow"
                          aria-label="URL del chat"
                          placeholder="https://…/popout/chat"
                          value={s.url}
                          onInput={(e) => updateUrl(i, e.currentTarget.value.trim())}
                          spellcheck={false}
                        />
                        <input
                          className="input name"
                          aria-label="Nombre"
                          value={s.name}
                          maxLength={MAX_NAME_LENGTH}
                          onInput={(e) => updateSource(i, { name: sanitizeName(e.currentTarget.value) })}
                        />
                        <label className="color-field">
                          <input type="color" value={s.color} onInput={(e) => updateSource(i, { color: e.currentTarget.value })} />
                          Color
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="icon-btn danger"
                      aria-label={`Quitar ${s.name}`}
                      title="Quitar"
                      onClick={() => removeSource(i)}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                );
              })}
            </section>

            <section className="card rise" style={stagger(3)}>
              <div className="card-head">
                <div className="card-title">
                  <Palette size={16} class="card-icon" />
                  <h2>Apariencia</h2>
                </div>
              </div>
              <div className="setting">
                <div>
                  <div className="setting-title">Tema</div>
                  <div className="setting-desc">Colores de la app y, cuando se puede, de los chats de Twitch y YouTube</div>
                </div>
                <Segmented
                  label="Tema"
                  value={config.theme}
                  onChange={(theme) => setConfig((c) => ({ ...c, theme }))}
                  options={[
                    { value: 'dark', label: <><Moon size={14} /> Oscuro</> },
                    { value: 'light', label: <><Sun size={14} /> Claro</> },
                    { value: 'system', label: <><Monitor size={14} /> Sistema</> },
                  ]}
                />
              </div>
            </section>

            <LoginInfoCard style={stagger(4)} />
          </div>

          <aside className="col-side">
            <section className="card padded rise" style={stagger(3)}>
              <div className="card-head bare">
                <div className="card-title">
                  <LayoutDashboard size={16} class="card-icon" />
                  <h2>Distribución</h2>
                </div>
                <span className="muted small">En pantalla ancha</span>
              </div>
              <div className="mini-grid" style={{ gridTemplateColumns: `repeat(${previewColumns}, 1fr)` }}>
                {validSources.length === 0 ? (
                  <div className="mini-panel empty">Sin chats</div>
                ) : (
                  validSources.map((s, i) => (
                    <div className="mini-panel" key={`${i}:${s.url}`} style={{ borderTopColor: s.color, ...stagger(i) }}>
                      {s.name}
                    </div>
                  ))
                )}
              </div>
              <p className="muted small">En pantallas más angostas las columnas bajan solas hasta quedar una debajo de otra.</p>
            </section>

            <section className="card padded rise" style={stagger(4)}>
              <div className="card-head bare">
                <div className="card-title">
                  <LayoutGrid size={16} class="card-icon" />
                  <h2>Tu grid</h2>
                </div>
                <span className="muted small">Se guarda solo</span>
              </div>
              {validSources.length > 0 ? (
                <a className="btn accent block" href="/grid" onClick={followLink}>
                  <LayoutGrid size={16} /> Abrir grid
                </a>
              ) : (
                <button type="button" className="btn accent block" disabled>
                  <LayoutGrid size={16} /> Abrir grid
                </button>
              )}
              <p className="muted small">
                Tus chats quedan guardados en este navegador. Entra a <code>/grid</code> cuando quieras; nada se sube a ningún
                servidor.
              </p>

              <div className="card-head bare share-head">
                <div className="card-title">
                  <Share2 size={16} class="card-icon" />
                  <h2>Compartir</h2>
                </div>
              </div>
              <div className="link-box">
                <code key={shareUrl} className="flash">
                  {shareUrl}
                </code>
                <button
                  type="button"
                  className={`btn soft small${copied ? ' is-done' : ''}`}
                  onClick={copy}
                  disabled={validSources.length === 0}
                >
                  <span key={String(copied)} className="pop-in icon-swap">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </span>
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="muted small">Quien abra este enlace recibe estos chats en su navegador.</p>
            </section>
          </aside>
        </div>

        <section id="guia" className="guide">
          {[
            { Icon: Copy, title: 'Copia el link del chat', text: 'En cada plataforma abre el chat en ventana aparte y copia la dirección.' },
            { Icon: ClipboardPaste, title: 'Pégalo aquí', text: 'Twitch, YouTube y Kick se adaptan solos. Cualquier otro sitio se carga tal cual.' },
            { Icon: LayoutGrid, title: 'Abre el grid', text: 'Todos tus chats a la vista, en una sola pestaña del navegador.' },
          ].map(({ Icon, title, text }, i) => (
            <div key={title} className="rise" style={stagger(5 + i)}>
              <span className="step">
                <Icon size={18} />
              </span>
              <div>
                <h3>
                  <span className="step-num">0{i + 1}</span> {title}
                </h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
