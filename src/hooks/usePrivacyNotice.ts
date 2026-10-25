import { useState } from 'preact/hooks';
import { APP_SLUG } from '../lib/brand';

const PRIVACY_SEEN_KEY = `${APP_SLUG}:privacy-notice-seen`;

/** El aviso completo se abre solo la primera vez; después queda a mano desde el encabezado. */
export function usePrivacyNotice() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(PRIVACY_SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(PRIVACY_SEEN_KEY, '1');
    } catch {
      /* sin almacenamiento: vuelve a salir en la próxima visita */
    }
  };

  return { open, show: () => setOpen(true), close };
}
