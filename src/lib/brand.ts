/**
 * Nombre de la app. Se cambia en el archivo .env (VITE_APP_NAME) sin tocar el código.
 * Después de cambiarlo hay que reiniciar `npm run dev` o volver a hacer `npm run build`.
 */
const env = import.meta.env ?? {};

export const APP_NAME: string = env.VITE_APP_NAME?.trim() || 'El Nexo';

export const APP_TAGLINE: string = env.VITE_APP_TAGLINE?.trim() || 'Todos tus chats en una pestaña';

/** Créditos del footer. */
export const APP_CREDITS = 'Producciones Alpeka/LonyArts';

/** Página de donaciones del botón del encabezado. */
export const DONATE_URL = 'https://ko-fi.com/lonyarts';

/** Versión del nombre segura para claves internas: "El Nexo" → "el-nexo". */
export const APP_SLUG: string =
  APP_NAME.normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'app';
