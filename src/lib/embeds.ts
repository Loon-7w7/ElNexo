import type { PopoutSource } from './config';
import { KNOWN_PLATFORMS, parsePlatformUrl, type KnownPlatform } from './platforms';

/**
 * Algunas plataformas bloquean su popout dentro de un iframe pero tienen una versión
 * incrustable. Aquí se traduce el link guardado a esa versión.
 * Los chats personalizados se cargan tal cual.
 */

export interface ResolvedPopout {
  /** URL que se carga en el iframe. */
  src: string;
  platform?: KnownPlatform;
  /** Canal o ID del directo, si se pudo leer del link. */
  channel?: string;
  host?: string;
}

export function resolvePopout(raw: string, theme: 'dark' | 'light'): ResolvedPopout {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { src: raw };
  }
  const host = url.hostname.replace(/^(www|m)\./, '');
  const known = parsePlatformUrl(url);
  if (!known) return { src: url.toString(), host };

  const { platform, channel } = known;
  const meta = KNOWN_PLATFORMS[platform];
  if (!meta.pattern.test(channel)) return { src: url.toString(), platform, host };
  // Twitch y YouTube exigen saber en qué dominio se incrusta el chat.
  const embedDomain = window.location.hostname;

  if (platform === 'twitch') {
    const params = new URLSearchParams({ parent: embedDomain });
    if (theme === 'dark') params.set('darkpopout', '');
    const name = channel.toLowerCase();
    return { platform, channel: name, host, src: `https://www.twitch.tv/embed/${name}/chat?${params}` };
  }
  if (platform === 'youtube') {
    const params = new URLSearchParams({ v: channel, embed_domain: embedDomain });
    if (theme === 'dark') params.set('dark_theme', '1');
    return { platform, channel, host, src: `https://www.youtube.com/live_chat?${params}` };
  }
  // Kick y Starvios: minúsculas también para links guardados o compartidos con mayúsculas.
  const name = channel.toLowerCase();
  return { platform, channel: name, host, src: meta.popoutUrl(name) };
}

/** Nombre que se propone al agregar un chat nuevo. */
export function suggestSource(url: string): PopoutSource {
  const { platform, channel, host } = resolvePopout(url, 'dark');
  if (platform) {
    const meta = KNOWN_PLATFORMS[platform];
    const name = platform === 'youtube' || !channel ? meta.label : channel;
    return { name: name.slice(0, 24), url, enabled: true };
  }
  return { name: (host ?? 'Chat').slice(0, 24), url, enabled: true };
}
