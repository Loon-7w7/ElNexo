/**
 * Plataformas del selector: cómo se ve cada una, qué acepta su campo (usuario o ID del directo)
 * y cómo se arma y se lee su link de popout. Este link es lo que se guarda y se comparte.
 */

export type KnownPlatform = 'twitch' | 'youtube' | 'kick' | 'starvios';

export interface PlatformMeta {
  label: string;
  color: string;
  /** Ícono en public/. */
  icon: string;
  /** Qué se escribe en el campo del selector. */
  field: string;
  placeholder: string;
  pattern: RegExp;
  /** Mensaje cuando el valor no cumple `pattern`. */
  error: string;
  popoutUrl: (id: string) => string;
}

export const KNOWN_PLATFORMS: Record<KnownPlatform, PlatformMeta> = {
  twitch: {
    label: 'Twitch',
    icon: '/twitch.svg',
    color: '#9146ff',
    field: 'Usuario',
    placeholder: 'nombre_del_canal',
    pattern: /^[a-zA-Z0-9_]{3,25}$/,
    error: 'El usuario de Twitch lleva de 3 a 25 letras, números o guion bajo.',
    popoutUrl: (id) => `https://www.twitch.tv/popout/${encodeURIComponent(id)}/chat`,
  },
  youtube: {
    label: 'YouTube',
    icon: '/youtube.svg',
    color: '#ff4d4d',
    field: 'ID del directo',
    placeholder: 'dQw4w9WgXcQ',
    pattern: /^[\w-]{11}$/,
    error: 'El ID del directo de YouTube son 11 caracteres: lo que va después de "v=" en el link.',
    popoutUrl: (id) => `https://www.youtube.com/live_chat?v=${encodeURIComponent(id)}`,
  },
  kick: {
    label: 'Kick',
    icon: '/kick.svg',
    color: '#53fc18',
    field: 'Usuario',
    placeholder: 'nombre-del-canal',
    pattern: /^[a-zA-Z0-9_-]{3,25}$/,
    error: 'El usuario de Kick lleva de 3 a 25 letras, números, guion o guion bajo.',
    popoutUrl: (id) => `https://kick.com/popout/${encodeURIComponent(id)}/chat`,
  },
  starvios: {
    label: 'Starvios',
    icon: '/starvios.svg',
    color: '#ff6db4',
    field: 'Usuario',
    placeholder: 'nombre_del_canal',
    pattern: /^[a-zA-Z0-9_.-]{2,30}$/,
    error: 'El usuario de Starvios lleva de 2 a 30 letras, números, punto, guion o guion bajo.',
    // Starvios no distingue mayúsculas: el usuario siempre se guarda en minúsculas.
    popoutUrl: (id) => `https://starvios.com/popout/chat/${encodeURIComponent(id.toLowerCase())}`,
  },
};

export const PLATFORM_IDS = Object.keys(KNOWN_PLATFORMS) as KnownPlatform[];

/** Rutas de Twitch que no son canales. */
const TWITCH_RESERVED = new Set(['directory', 'videos', 'settings', 'search', 'downloads', 'p', 'popout', 'embed']);

function decode(value: string | undefined): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
}

function youTubeId(url: URL, host: string): string {
  if (host === 'youtu.be') return decode(url.pathname.split('/')[1]);
  const fromQuery = url.searchParams.get('v');
  if (fromQuery !== null) return fromQuery;
  return decode(url.pathname.match(/^\/(?:live|embed|shorts)\/([^/]+)\/?$/)?.[1]);
}

/**
 * Si el link es de una plataforma conocida devuelve cuál y el canal o ID que trae
 * (vacío si no se pudo leer). También lee los links de versiones anteriores (twitch.tv/canal).
 */
export function parsePlatformUrl(url: URL): { platform: KnownPlatform; channel: string } | null {
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, '');
  const path = url.pathname;

  if (host === 'twitch.tv') {
    const match = path.match(/^\/(?:popout|embed)\/([^/]*)\/chat\/?$/) ?? path.match(/^\/([^/]+)\/?$/);
    const channel = decode(match?.[1]);
    return { platform: 'twitch', channel: TWITCH_RESERVED.has(channel.toLowerCase()) ? '' : channel };
  }
  if (host === 'youtube.com' || host === 'youtu.be') return { platform: 'youtube', channel: youTubeId(url, host) };
  if (host === 'kick.com') {
    const match = path.match(/^\/popout\/([^/]*)\/chat\/?$/) ?? path.match(/^\/([^/]+)\/?$/);
    return { platform: 'kick', channel: decode(match?.[1]) };
  }
  if (host === 'starvios.com') {
    return { platform: 'starvios', channel: decode(path.match(/^\/popout\/chat\/([^/]*)\/?$/)?.[1]) };
  }
  return null;
}

/** Color de los chats personalizados. */
export const CUSTOM_COLOR = '#facc15';

/** El color de un chat lo define su plataforma; los personalizados van en amarillo. */
export function sourceColor(url: string): string {
  try {
    const known = parsePlatformUrl(new URL(url));
    return known ? KNOWN_PLATFORMS[known.platform].color : CUSTOM_COLOR;
  } catch {
    return CUSTOM_COLOR;
  }
}

/** Valida lo que se escribe en el campo del selector. Devuelve el mensaje de error o null. */
export function channelError(platform: KnownPlatform, value: string): string | null {
  const meta = KNOWN_PLATFORMS[platform];
  if (!value) return `Escribe el ${meta.field.toLowerCase()}.`;
  if (/[/:]|\.(com|tv|be)\b/i.test(value)) return `Escribe solo el ${meta.field.toLowerCase()}, sin el link.`;
  return meta.pattern.test(value) ? null : meta.error;
}

/** Acortadores: esconden el destino real del link. */
const SHORTENERS = new Set([
  'bit.ly',
  'buff.ly',
  'cutt.ly',
  'goo.gl',
  'is.gd',
  'lnkd.in',
  'ow.ly',
  'rb.gy',
  'rebrand.ly',
  's.id',
  'shorturl.at',
  't.co',
  't.ly',
  'tiny.cc',
  'tinyurl.com',
]);

/** Reglas extra de los chats personalizados (además de las de isSafeUrl). Devuelve el error o null. */
export function customHostError(url: URL): string | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (/^\d+(\.\d+){3}$/.test(host)) return 'Usa el nombre del sitio, no una dirección IP.';
  if (SHORTENERS.has(host)) return 'Los links acortados no se aceptan: pega el link completo del chat.';
  return null;
}
