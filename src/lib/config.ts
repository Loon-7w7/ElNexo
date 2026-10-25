import { APP_SLUG } from './brand';
import { customHostError, KNOWN_PLATFORMS, parsePlatformUrl, sourceColor } from './platforms';

/**
 * La configuración vive en localStorage (sin login ni base de datos) y la barra de direcciones
 * queda limpia. Solo el enlace para compartir lleva los popouts:
 * /grid?p=Mi%20chat|9146ff|https://www.twitch.tv/popout/canal/chat&theme=light
 * (los chats desactivados van con `x=` en lugar de `p=`).
 */

export interface PopoutSource {
  name: string;
  url: string;
  /** Un chat desactivado sigue en la lista (y en el enlace para compartir) pero no se carga en el grid. */
  enabled: boolean;
}

export type Theme = 'dark' | 'light' | 'system';

export interface Config {
  sources: PopoutSource[];
  theme: Theme;
}

export const DEFAULT_CONFIG: Config = {
  sources: [],
  theme: 'dark',
};

/** Más iframes que esto congelan la pestaña; también frena enlaces compartidos abusivos. */
export const MAX_SOURCES = 12;
/** Chats que se cargan a la vez en el grid; el resto se puede tener en la lista desactivado. */
export const MAX_ACTIVE = 4;
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
 * Un chat es válido si es de una plataforma conocida con un usuario o ID correcto,
 * o si es un link personalizado que pasa las reglas de seguridad.
 */
export function isValidSourceUrl(url: string): boolean {
  if (!isSafeUrl(url)) return false;
  const parsed = new URL(url);
  const known = parsePlatformUrl(parsed);
  if (known) return KNOWN_PLATFORMS[known.platform].pattern.test(known.channel);
  return PRIVATE_HOST.test(parsed.hostname) || customHostError(parsed) === null;
}

/** Por qué no se acepta un link en la opción "Personalizada", o null si se acepta. */
export function customUrlError(url: string): string | null {
  if (!isSafeUrl(url)) return 'Ese link no sirve: debe empezar con https:// y ser de un sitio público.';
  const parsed = new URL(url);
  const known = parsePlatformUrl(parsed);
  if (known) {
    const meta = KNOWN_PLATFORMS[known.platform];
    return `Para ${meta.label} elige "${meta.label}" en el selector y escribe solo el ${meta.field.toLowerCase()}.`;
  }
  return PRIVATE_HOST.test(parsed.hostname) ? null : customHostError(parsed);
}

/**
 * Quita caracteres de control e invisibles (incluye los bidi, que invierten el texto
 * para suplantar nombres) y el separador "|". No recorta espacios: se usa mientras se escribe.
 */
export function sanitizeName(name: string): string {
  return name.replace(/[\p{C}|]/gu, '').slice(0, MAX_NAME_LENGTH);
}

function parseSource(raw: string, enabled: boolean): PopoutSource {
  // El segundo campo es el color: se mantiene en el formato, pero ahora lo define la plataforma.
  const [name, , ...rest] = raw.split('|');
  return {
    name: sanitizeName(name).trim() || 'Chat',
    url: rest.join('|').trim(),
    enabled,
  };
}

/** `p` es un chat activo y `x` uno desactivado; `c` es el parámetro de los enlaces de la versión anterior. */
const ENABLED_KEYS = new Set(['p', 'c']);
const DISABLED_KEY = 'x';

export function parseConfig(params: URLSearchParams): Config {
  const sources = [...params]
    .filter(([key]) => ENABLED_KEYS.has(key) || key === DISABLED_KEY)
    .map(([key, value]) => parseSource(value, key !== DISABLED_KEY))
    .filter((s) => isValidSourceUrl(s.url))
    .slice(0, MAX_SOURCES);
  // Un enlace o una configuración guardada con más activos de la cuenta: se apagan los últimos.
  let active = 0;
  for (const s of sources) {
    if (s.enabled && ++active > MAX_ACTIVE) s.enabled = false;
  }
  const theme = params.get('theme');
  return {
    sources,
    theme: theme === 'light' || theme === 'system' ? theme : 'dark',
  };
}

export function serializeConfig(config: Config): string {
  const params = new URLSearchParams();
  for (const s of config.sources.filter((s) => isValidSourceUrl(s.url)).slice(0, MAX_SOURCES)) {
    params.append(s.enabled ? 'p' : DISABLED_KEY, `${sanitizeName(s.name).trim()}|${sourceColor(s.url).replace('#', '')}|${s.url}`);
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
