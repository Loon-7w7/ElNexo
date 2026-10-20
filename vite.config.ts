import { readFileSync } from 'node:fs'
import preact from '@preact/preset-vite'
import { defineConfig, type Plugin } from 'vite'

/** Las cabeceras de seguridad de vercel.json, para probarlas igual con `npm run preview`. */
function vercelHeaders(): Record<string, string> {
  const { headers } = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[]
  }
  const all = headers.find((h) => h.source === '/(.*)')?.headers ?? []
  return Object.fromEntries(all.map((h) => [h.key, h.value]))
}

/** Precarga la fuente del texto normal para que no haya salto de tipografía al cargar. */
function preloadMainFont(): Plugin {
  return {
    name: 'preload-main-font',
    enforce: 'post',
    transformIndexHtml(_html, ctx) {
      const font = Object.keys(ctx.bundle ?? {}).find((f) => /geist-sans-latin-400-normal-.*\.woff2$/.test(f))
      if (!font) return
      return [
        {
          tag: 'link',
          attrs: { rel: 'preload', href: `/${font}`, as: 'font', type: 'font/woff2', crossorigin: '' },
          injectTo: 'head',
        },
      ]
    },
  }
}

// Rutas absolutas: /grid y / cargan los mismos archivos. En Vercel, vercel.json reescribe toda ruta a index.html.
export default defineConfig({
  base: '/',
  plugins: [preact(), preloadMainFont()],
  build: {
    // Navegadores actuales: sin polyfills ni transformaciones de más.
    target: 'es2022',
    modulePreload: { polyfill: false },
  },
  preview: {
    headers: vercelHeaders(),
  },
})
