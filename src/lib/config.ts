import { APP_SLUG } from './brand';

/**
 * La configuración vive en localStorage (sin login ni base de datos) y la barra de direcciones
 * queda limpia. Solo el enlace para compartir lleva los popouts:
 * /grid?p=Mi%20chat|9146ff|https://www.twitch.tv/popout/canal/chat&theme=light
 */

export interface PopoutSource {
  name: string;
  color: string;
  url: string;
}

export type Theme = 'dark' | 'light' | 'system';

export interface Config {
  sources: PopoutSource[];
  theme: Theme;
}

export const DEFAULT_COLOR = '#a78bfa';

export const DEFAULT_CONFIG: Config = {
  sources: [],
  theme: 'dark',
};

/** Más iframes que esto congelan la pestaña; también frena enlaces compartidos abusivos. */
export const MAX_SOURCES = 12;
export const MAX_NAME_LENGTH = 24;
const MAX_URL_LENGTH = 2000;

/** Red local, IPs privadas y literales IPv6: un enlace compartido no debe apuntar a la red de quien lo abre. */
const PRIVATE_HOST =
  /^(localhost|.+\.(local|localhost|internal|lan|home|arpa))$|^(0|10|127)\.|^169\.254\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\.|^\[/i;

/** Mientras se desarrolla en local se permiten popouts locales y http. */
function runningLocally(): boolean {
  return typeof window !== 'undefined' && PRIVATE_HOST.test(window.location.hostname);
}

export function isSafeUrl(url: string): boolean {
  // El navegador "arregla" textos como "https://no es un link": se rechazan antes.
  if (url.length > MAX_URL_LENGTH || /\s/.test(url)) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  const { protocol, hostname, host, username, password } = parsed;
  // Credenciales en la URL sirven para disfrazar el destino: https://twitch.tv@sitio-falso.com
  if (username || password) return false;
  // La app no se incrusta a sí misma (evita grids anidados sin fin).
  if (typeof window !== 'undefined' && host === window.location.host) return false;
  if (PRIVATE_HOST.test(hostname)) return runningLocally();
  if (!/^[^.%]+(\.[^.%]+)+$/.test(hostname)) return false;
  return protocol === 'https:' || (protocol === 'http:' && runningLocally());
}

/**
 * Quita caracteres de control e invisibles (incluye los bidi, que invierten el texto
 * para suplantar nombres) y el separador "|". No recorta espacios: se usa mientras se escribe.
 */
export function sanitizeName(name: string): string {
  return name.replace(/[\p{C}|]/gu, '').slice(0, MAX_NAME_LENGTH);
}

function parseSource(raw: string): PopoutSource {
  const [name, color, ...rest] = raw.split('|');
  const hex = (color ?? '').replace('#', '');
  return {
    name: sanitizeName(name).trim() || 'Chat',
    color: /^[0-9a-f]{6}$/i.test(hex) ? `#${hex}` : DEFAULT_COLOR,
    url: rest.join('|').trim(),
  };
}

export function parseConfig(params: URLSearchParams): Config {
  // `c` es el parámetro que usaban los enlaces de la versión anterior.
  const sources = [...params]
    .filter(([key]) => key === 'p' || key === 'c')
    .map(([, value]) => parseSource(value))
    .filter((s) => isSafeUrl(s.url))
    .slice(0, MAX_SOURCES);
  const theme = params.get('theme');
  return {
    sources,
    theme: theme === 'light' || theme === 'system' ? theme : 'dark',
  };
}

export function serializeConfig(config: Config): string {
  const params = new URLSearchParams();
  for (const s of config.sources.filter((s) => isSafeUrl(s.url)).slice(0, MAX_SOURCES)) {
    params.append('p', `${sanitizeName(s.name).trim()}|${s.color.replace('#', '')}|${s.url}`);
  }
  if (config.theme !== 'dark') params.set('theme', config.theme);
  return params.toString();
}

/** Enlace para compartir: quien lo abre importa estos popouts a su navegador. */
export function buildShareUrl(config: Config): string {
  const query = serializeConfig(config);
  return `${window.location.origin}/grid${query ? `?${query}` : ''}`;
}

/** Configuración guardada en este navegador (nunca sale de aquí). */
export const STORAGE_KEY = `${APP_SLUG}:last-config`;

/** Copia en memoria: la app sigue funcionando si el navegador bloquea localStorage. */
let memory: Config | null = null;

export function loadLastConfig(): Config {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) return parseConfig(new URLSearchParams(raw));
  } catch {
    /* sin almacenamiento disponible */
  }
  return memory ?? DEFAULT_CONFIG;
}

export function saveLastConfig(config: Config): void {
  memory = config;
  try {
    localStorage.setItem(STORAGE_KEY, serializeConfig(config));
  } catch {
    /* sin almacenamiento disponible */
  }
}

/**
 * Al arrancar: si la URL trae popouts (enlace compartido o enlace viejo con #/grid?p=…),
 * se guardan en localStorage y la URL se limpia. Devuelve la ruta limpia a mostrar.
 * Un enlace sin popouts válidos no borra lo que ya estaba guardado.
 */
export function importSharedConfig(): string {
  const { pathname, search, hash } = window.location;
  let path = pathname;
  let query = search.slice(1);
  if (hash.startsWith('#/')) {
    // Enlaces de versiones anteriores: #/grid?p=… y #/chat?c=…
    const index = hash.indexOf('?');
    path = index === -1 ? hash.slice(1) : hash.slice(1, index);
    query = index === -1 ? '' : hash.slice(index + 1);
  }
  if (path === '/chat') path = '/grid';

  const params = new URLSearchParams(query);
  const shared = parseConfig(params);
  if (shared.sources.length > 0) {
    saveLastConfig(shared);
  } else if (params.has('theme')) {
    saveLastConfig({ ...loadLastConfig(), theme: shared.theme });
  }

  if (query || hash.startsWith('#/') || path !== pathname) window.history.replaceState(null, '', path);
  return path;
}
