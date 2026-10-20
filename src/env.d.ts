/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Nombre visible de la app (por defecto "El Nexo"). */
  readonly VITE_APP_NAME?: string;
  /** Frase corta que acompaña al nombre en el título de la pestaña. */
  readonly VITE_APP_TAGLINE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
