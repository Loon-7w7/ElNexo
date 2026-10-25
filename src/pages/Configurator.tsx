import {
  ArrowUpDown,
  AtSign,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  ClipboardPaste,
  Coffee,
  Copy,
  Globe,
  GripVertical,
  Hash,
  Info,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Link,
  LockKeyhole,
  HardDrive,
  Monitor,
  Moon,
  Palette,
  Plus,
  Settings,
  Share2,
  ShieldCheck,
  Sun,
  Trash,
  WandSparkles,
} from 'lucide-preact';
import type { TargetedPointerEvent, TargetedSubmitEvent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { PrivacyNotice } from '../components/LoginNotice';
import { Logo, Modal, PlatformIcon, Segmented, SiteFooter, TagBadge } from '../components/ui';
import { usePrivacyNotice } from '../hooks/usePrivacyNotice';
import { useResolvedTheme } from '../hooks/useResolvedTheme';
import { APP_NAME, DONATE_URL } from '../lib/brand';
import {
  buildShareUrl,
  customUrlError,
  isValidSourceUrl,
  loadLastConfig,
  MAX_ACTIVE,
  MAX_SOURCES,
  saveLastConfig,
  type Config,
  type PopoutSource,
} from '../lib/config';
import { suggestSource } from '../lib/embeds';
import {
  channelError,
  CUSTOM_COLOR,
  KNOWN_PLATFORMS,
  parsePlatformUrl,
  PLATFORM_IDS,
  sourceColor,
  type KnownPlatform,
} from '../lib/platforms';
import { followLink } from '../lib/router';

/** Acepta links sin "https://" (ej. "kick.com/popout/canal/chat"). */
function normalizeUrl(input: string): string {
  const value = input.trim();
  if (!value || /^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function platformOf(url: string) {
  try {
    return parsePlatformUrl(new URL(url));
  } catch {
    return null;
  }
}

type PlatformChoice = KnownPlatform | 'custom';

/** Índice para escalonar animaciones de entrada (ver .rise en themes.css). */
const stagger = (i: number) => ({ '--i': String(i) });

export function Configurator() {
  const [config, setConfig] = useState<Config>(loadLastConfig);
  const [platform, setPlatform] = useState<PlatformChoice>('twitch');
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const privacy = usePrivacyNotice();
  useResolvedTheme(config.theme);

  useEffect(() => saveLastConfig(config), [config]);

  const shareUrl = useMemo(() => buildShareUrl(config), [config]);
  const validSources = config.sources.filter((s) => isValidSourceUrl(s.url));
  const activeSources = validSources.filter((s) => s.enabled);

  const setSources = (sources: PopoutSource[]) => setConfig((c) => ({ ...c, sources }));

  const addSource = (e: TargetedSubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (config.sources.length >= MAX_SOURCES) {
      setDraftError(`Máximo ${MAX_SOURCES} chats por grid. Quita alguno para agregar otro.`);
      return;
    }
    let url: string;
    if (platform === 'custom') {
      url = normalizeUrl(draft);
      const error = customUrlError(url);
      if (error) return setDraftError(error);
    } else {
      const value = draft.trim();
      const error = channelError(platform, value);
      if (error) return setDraftError(error);
      url = KNOWN_PLATFORMS[platform].popoutUrl(value);
    }
    // Con el máximo de activos el chat entra a la lista apagado.
    const enabled = activeSources.length < MAX_ACTIVE;
    setSources([...config.sources, { ...suggestSource(url), enabled }]);
    setDraft('');
    setDraftError('');
    setDraftNote(
      enabled ? '' : `Ya tienes ${MAX_ACTIVE} chats activos: este se agregó desactivado. Apaga otro para activarlo.`,
    );
  };

  const updateSource = (index: number, patch: Partial<PopoutSource>) =>
    setSources(config.sources.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  // El nombre siempre sale del link.
  const updateUrl = (index: number, url: string) => updateSource(index, { url, name: suggestSource(url).name });

  const removeSource = (index: number) => setSources(config.sources.filter((_, i) => i !== index));

  // El orden de la lista es el del grid: con 3 chats, el primero ocupa la columna grande.
  const moveSource = (from: number, to: number) => {
    if (from === to || to < 0 || to >= config.sources.length) return;
    const next = [...config.sources];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSources(next);
  };

  // Arrastre con pointer events: funciona igual con mouse y con el dedo.
  const listRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  // Las flechas y el asa solo se muestran en modo ordenar, para no saturar las filas.
  const [sorting, setSorting] = useState(false);
  const canSort = config.sources.length > 1;
  useEffect(() => {
    if (!canSort) setSorting(false);
  }, [canSort]);

  const startDrag = (index: number, e: TargetedPointerEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragIndex(index);
  };

  const onDragMove = (e: TargetedPointerEvent<HTMLSpanElement>) => {
    if (dragIndex === null || !listRef.current) return;
    const rows = [...listRef.current.querySelectorAll<HTMLElement>(':scope > .source-row')];
    // Nueva posición: cuántas de las otras filas tienen su mitad por encima del puntero.
    const to = rows.filter((row, j) => {
      if (j === dragIndex) return false;
      const rect = row.getBoundingClientRect();
      return e.clientY > rect.top + rect.height / 2;
    }).length;
    if (to !== dragIndex) {
      moveSource(dragIndex, to);
      setDragIndex(to);
    }
  };

  const endDrag = () => setDragIndex(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copia el enlace:', shareUrl);
    }
  };

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
          <div className="topbar-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label="Inicio de sesión y privacidad"
              title="Inicio de sesión y privacidad"
              onClick={privacy.show}
            >
              <LockKeyhole size={18} />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Configuración"
              title="Configuración"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings size={18} />
            </button>
            <a className="btn kofi" href={DONATE_URL} target="_blank" rel="noopener noreferrer">
              <Coffee size={16} /> Apóyame en Ko-fi
            </a>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="page-head">
          <div className="rise" style={stagger(0)}>
            <div className="eyebrow">Nuevo grid</div>
            <h1>Todos tus chats en una pestaña</h1>
            <p className="lede">
              Elige la plataforma y escribe el canal, o pega el link de cualquier otro chat. Se acomodan solos en un grid
              que se adapta a tu pantalla.
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
                <div className="card-head-actions">
                  <span className="muted small">
                    Activos {activeSources.length}/{MAX_ACTIVE}
                  </span>
                  {canSort && (
                    <button
                      type="button"
                      className={`btn small ${sorting ? 'accent' : 'soft'}`}
                      aria-pressed={sorting}
                      onClick={() => setSorting((on) => !on)}
                    >
                      {sorting ? <Check size={14} /> : <ArrowUpDown size={14} />}
                      {sorting ? 'Listo' : 'Ordenar'}
                    </button>
                  )}
                </div>
              </div>

              <form className="add-form" onSubmit={addSource}>
                <div className="select-field">
                  <span className="select-icon" aria-hidden="true">
                    {platform === 'custom' ? <Link size={14} /> : <PlatformIcon platform={platform} />}
                  </span>
                  <select
                    className="input platform-select"
                    aria-label="Plataforma"
                    value={platform}
                    onChange={(e) => {
                      setPlatform(e.currentTarget.value as PlatformChoice);
                      setDraftError('');
                      setDraftNote('');
                    }}
                  >
                    {PLATFORM_IDS.map((id) => (
                      <option key={id} value={id}>
                        {KNOWN_PLATFORMS[id].label}
                      </option>
                    ))}
                    <option value="custom">Personalizada</option>
                  </select>
                </div>
                <label className={`prefixed-input grow${draftError ? ' shake' : ''}`}>
                  <span className="prefix">
                    {platform === 'custom' ? <Link size={14} /> : platform === 'youtube' ? <Hash size={14} /> : <AtSign size={14} />}
                  </span>
                  <input
                    aria-label={
                      platform === 'custom'
                        ? 'Link del chat'
                        : `${KNOWN_PLATFORMS[platform].field} de ${KNOWN_PLATFORMS[platform].label}`
                    }
                    placeholder={platform === 'custom' ? 'https://sitio.com/popout/chat' : KNOWN_PLATFORMS[platform].placeholder}
                    value={draft}
                    onInput={(e) => {
                      setDraft(e.currentTarget.value);
                      setDraftError('');
                      setDraftNote('');
                    }}
                    spellcheck={false}
                    autocomplete="off"
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
                {draftNote && (
                  <p className="field-note rise">
                    <Info size={13} /> {draftNote}
                  </p>
                )}
              </form>

              {config.sources.length === 0 && (
                <div className="empty-sources rise">
                  <ClipboardPaste size={22} class="empty-sources-icon" />
                  <div>
                    <p>Todavía no hay chats. Elige la plataforma y escribe:</p>
                    <ul>
                      <li>
                        <strong>Twitch, Kick o Starvios:</strong> el nombre del canal
                      </li>
                      <li>
                        <strong>YouTube:</strong> el ID del directo, lo que va después de <code>v=</code> en el link
                      </li>
                      <li>
                        <strong>Personalizada:</strong> el link completo del chat de cualquier otro sitio
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <div ref={listRef} className={`source-list${dragIndex === null ? '' : ' is-sorting'}`}>
                {config.sources.map((s, i) => {
                  const valid = isValidSourceUrl(s.url);
                  const known = platformOf(s.url);
                  const meta = known ? KNOWN_PLATFORMS[known.platform] : null;
                  const StatusIcon = !valid ? CircleAlert : meta ? WandSparkles : CircleCheck;
                  const atLimit = !s.enabled && activeSources.length >= MAX_ACTIVE;
                  return (
                    <div
                      className={`source-row rise${s.enabled ? '' : ' is-off'}${dragIndex === i ? ' is-dragging' : ''}`}
                      key={i}
                    >
                      {sorting && canSort && (
                        <div className="source-order">
                          <button
                            type="button"
                            className="icon-btn tiny"
                            aria-label={`Subir ${s.name}`}
                            title="Subir"
                            disabled={i === 0}
                            onClick={() => moveSource(i, i - 1)}
                          >
                            <ChevronUp size={14} />
                          </button>
                          <span
                            className="drag-handle"
                            title="Arrastra para cambiar el orden"
                            aria-hidden="true"
                            onPointerDown={(e) => startDrag(i, e)}
                            onPointerMove={onDragMove}
                            onPointerUp={endDrag}
                            onPointerCancel={endDrag}
                          >
                            <GripVertical size={16} />
                          </span>
                          <button
                            type="button"
                            className="icon-btn tiny"
                            aria-label={`Bajar ${s.name}`}
                            title="Bajar"
                            disabled={i === config.sources.length - 1}
                            onClick={() => moveSource(i, i + 1)}
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      )}
                      {known ? (
                        <span className="platform-tile">
                          <PlatformIcon platform={known.platform} size={20} />
                        </span>
                      ) : (
                        <TagBadge tag={s.name.slice(0, 2).toUpperCase() || 'CH'} color={CUSTOM_COLOR} />
                      )}
                      <div className="source-main">
                        <div className="source-title">
                          <span>{s.name || 'Chat'}</span>
                          <span className={`status status-${valid ? 'connected' : 'error'}`}>
                            <StatusIcon size={13} />
                            {!valid
                              ? meta
                                ? `${meta.field} no válido`
                                : 'URL no válida'
                              : meta
                                ? `${meta.label} · adaptado para incrustar`
                                : 'Personalizado · se carga tal cual'}
                          </span>
                        </div>
                        <div className="custom-fields">
                          {known && meta ? (
                            <label className="prefixed-input grow">
                              <span className="prefix">
                                {known.platform === 'youtube' ? <Hash size={14} /> : <AtSign size={14} />}
                              </span>
                              <input
                                aria-label={`${meta.field} de ${meta.label}`}
                                placeholder={meta.placeholder}
                                value={known.channel}
                                onInput={(e) => updateUrl(i, meta.popoutUrl(e.currentTarget.value.trim()))}
                                spellcheck={false}
                                autocomplete="off"
                              />
                            </label>
                          ) : (
                            <input
                              className="input mono grow"
                              aria-label="URL del chat"
                              placeholder="https://…/popout/chat"
                              value={s.url}
                              onInput={(e) => updateUrl(i, e.currentTarget.value.trim())}
                              spellcheck={false}
                            />
                          )}
                          <button
                            type="button"
                            role="switch"
                            className="toggle-field"
                            aria-checked={s.enabled}
                            aria-label={`Mostrar ${s.name} en el grid`}
                            disabled={atLimit}
                            title={atLimit ? `Máximo ${MAX_ACTIVE} chats activos: apaga otro primero` : undefined}
                            onClick={() => updateSource(i, { enabled: !s.enabled })}
                          >
                            <span className="toggle" aria-hidden="true" />
                            {s.enabled ? 'Activo' : 'Inactivo'}
                          </button>
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
              </div>
            </section>

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
              <div className="mini-grid" data-count={activeSources.length}>
                {activeSources.length === 0 ? (
                  <div className="mini-panel empty">{validSources.length === 0 ? 'Sin chats' : 'Sin chats activos'}</div>
                ) : (
                  activeSources.map((s, i) => {
                    const known = platformOf(s.url);
                    return (
                      <div className="mini-panel" key={`${i}:${s.url}`} style={{ borderTopColor: sourceColor(s.url), ...stagger(i) }}>
                        {known && <PlatformIcon platform={known.platform} size={12} />}
                        {s.name}
                      </div>
                    );
                  })
                )}
              </div>
              <p className="muted small">En el celular quedan uno debajo de otro.</p>
            </section>

            <section className="card padded rise" style={stagger(4)}>
              <div className="card-head bare">
                <div className="card-title">
                  <LayoutGrid size={16} class="card-icon" />
                  <h2>Tu grid</h2>
                </div>
                <span className="muted small">Se guarda solo</span>
              </div>
              {activeSources.length > 0 ? (
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

        <section id="guia" className="guide-wrap">
          <div className="guide-head rise" style={stagger(5)}>
            <span className="custom-badge">
              <Link size={12} /> Solo para chats personalizados
            </span>
            <p className="muted small">
              Para Twitch, YouTube, Kick y Starvios basta con elegir la plataforma y escribir el usuario o el ID del directo.
            </p>
          </div>
          <div className="guide">
            {[
              { Icon: Copy, title: 'Copia el link del chat', text: 'En el sitio abre el chat en ventana aparte y copia la dirección.' },
              { Icon: ClipboardPaste, title: 'Pégalo aquí', text: 'Elige "Personalizada" en el selector y pega el link. Se carga tal cual.' },
              { Icon: LayoutGrid, title: 'Abre el grid', text: 'Todos tus chats a la vista, en una sola pestaña del navegador.' },
            ].map(({ Icon, title, text }, i) => (
              <div key={title} className="rise" style={stagger(6 + i)}>
                <span className="step">
                  <Icon size={15} />
                </span>
                <div>
                  <h3>
                    <span className="step-num">0{i + 1}</span> {title}
                  </h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Configuración"
        icon={<Settings size={16} class="card-icon" />}
      >
        <div className="setting-group">
          <Palette size={14} /> Apariencia
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
      </Modal>

      <PrivacyNotice open={privacy.open} onClose={privacy.close} />
    </div>
  );
}
