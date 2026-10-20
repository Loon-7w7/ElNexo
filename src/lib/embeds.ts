import { DEFAULT_COLOR, type PopoutSource } from './config';

/**
 * Algunas plataformas bloquean su popout dentro de un iframe pero tienen una versión
 * incrustable. Aquí se traduce el link que pega el usuario a esa versión.
 * Cualquier otro sitio se carga tal cual.
 */

export type KnownPlatform = 'twitch' | 'youtube' | 'kick';

export const KNOWN_PLATFORMS: Record<KnownPlatform, { label: string; tag: string; color: string }> = {
  twitch: { label: 'Twitch', tag: 'TW', color: '#9146ff' },
  youtube: { label: 'YouTube', tag: 'YT', color: '#ff4d4d' },
  kick: { label: 'Kick', tag: 'KK', color: '#53fc18' },
};

export interface ResolvedPopout {
  /** URL que se carga en el iframe. */
  src: string;
  platform?: KnownPlatform;
  /** Canal o ID del directo, si se pudo leer del link. */
  channel?: string;
  host?: string;
}

const TWITCH_RESERVED = new Set(['directory', 'videos', 'settings', 'search', 'downloads', 'p']);

function youTubeId(url: URL): string | undefined {
  const fromQuery = url.searchParams.get('v');
  if (fromQuery) return fromQuery;
  const match = url.pathname.match(/^\/(?:live|embed|shorts)?\/?([\w-]{11})$/);
  return match?.[1];
}

export function resolvePopout(raw: string, theme: 'dark' | 'light'): ResolvedPopout {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { src: raw };
  }
  const host = url.hostname.replace(/^(www|m)\./, '');
  const parts = url.pathname.split('/').filter(Boolean);
  // Twitch y YouTube exigen saber en qué dominio se incrusta el chat.
  const embedDomain = window.location.hostname;

  if (host === 'twitch.tv') {
    // twitch.tv/canal · twitch.tv/popout/canal/chat · twitch.tv/embed/canal/chat
    const channel = (parts[0] === 'popout' || parts[0] === 'embed' ? parts[1] : parts[0])?.toLowerCase();
    if (channel && !TWITCH_RESERVED.has(channel)) {
      const params = new URLSearchParams({ parent: embedDomain });
      if (theme === 'dark') params.set('darkpopout', '');
      return { platform: 'twitch', channel, host, src: `https://www.twitch.tv/embed/${channel}/chat?${params}` };
    }
  }

  if (host === 'youtube.com' || host === 'youtu.be') {
    const id = host === 'youtu.be' ? parts[0] : youTubeId(url);
    if (id) {
      const params = new URLSearchParams({ v: id, embed_domain: embedDomain });
      if (theme === 'dark') params.set('dark_theme', '1');
      return { platform: 'youtube', channel: id, host, src: `https://www.youtube.com/live_chat?${params}` };
    }
  }

  if (host === 'kick.com') {
    // kick.com/canal · kick.com/popout/canal/chat
    const channel = (parts[0] === 'popout' ? parts[1] : parts[0])?.toLowerCase();
    if (channel) return { platform: 'kick', channel, host, src: `https://kick.com/popout/${channel}/chat` };
  }

  return { src: url.toString(), host };
}

/** Nombre y color que se proponen al pegar un link nuevo. */
export function suggestSource(url: string): PopoutSource {
  const { platform, channel, host } = resolvePopout(url, 'dark');
  if (platform) {
    const meta = KNOWN_PLATFORMS[platform];
    const name = platform === 'youtube' ? 'YouTube' : (channel ?? meta.label);
    return { name: name.slice(0, 24), color: meta.color, url };
  }
  return { name: (host ?? 'Chat').slice(0, 24), color: DEFAULT_COLOR, url };
}
