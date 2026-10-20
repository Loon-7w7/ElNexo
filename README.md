# El Nexo

Junta los popouts de cualquier plataforma en un grid responsivo, en una sola pestaña del navegador.
No se conecta a ninguna red social: tú pegas el link del popout de cada sitio y la app lo muestra en un iframe.
Sin cuentas, sin base de datos: tus popouts se guardan en tu navegador (`localStorage`) y la dirección queda limpia.

## Cambiar el nombre de la app

El nombre no está escrito en el código: se toma del archivo `.env`.

```bash
cp .env.example .env   # si aún no existe
```

```env
VITE_APP_NAME="El Nexo"
VITE_APP_TAGLINE="Todos tus popouts en una pestaña"
```

Cambia el valor, reinicia `npm run dev` (o vuelve a correr `npm run build`) y el nuevo nombre aparece en el encabezado, el grid y el título de la pestaña. Si no hay `.env`, se usa "El Nexo".

## Empezar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # sitio estático en dist/
```

`dist/` se puede subir tal cual a cualquier hosting estático (Vercel, GitHub Pages, Netlify, Cloudflare Pages…).

### Vercel

Todo está listo para el plan gratuito (Hobby):

| Archivo | Qué hace |
| --- | --- |
| `vercel.json` | Build `npm run build`, salida `dist`, reescritura de toda ruta (menos `/assets/`) a `index.html` para que `/grid` funcione al recargar, caché permanente de `assets/` y cabeceras de seguridad |
| `.vercelignore` | Lo que no se sube con la CLI (`dist`, `.env`, `graphify-out`…) |
| `package.json` → `engines` | Node 22 en el servidor de build |
| `public/robots.txt` | Permite que los buscadores indexen la app |

**Opción A — con GitHub (recomendada, se publica sola en cada `git push`):**

1. Sube el proyecto a un repositorio de GitHub (`.env`, `dist` y `graphify-out` ya están en `.gitignore`).
2. En [vercel.com/new](https://vercel.com/new) importa el repositorio. Vercel detecta Vite y lee `vercel.json`: no hay que cambiar nada.
3. *Deploy*.

**Opción B — desde la terminal:**

```bash
npx vercel          # primera vez: inicia sesión y crea el proyecto (despliegue de prueba)
npx vercel --prod   # publica en producción
```

**Nombre de la app (opcional):** en *Settings → Environment Variables* agrega `VITE_APP_NAME` y
`VITE_APP_TAGLINE` y vuelve a desplegar. Si no las pones se usan "El Nexo" y "Todos tus chats en una pestaña".
El `.env` local nunca se sube, y cualquier variable `VITE_*` termina en el código público: no pongas secretos ahí.

**Después de publicar, comprueba:**

- `tu-app.vercel.app/grid` carga al recargar la página (reescritura).
- Los chats de Twitch, Kick y YouTube cargan dentro del grid y puedes iniciar sesión en ellos (si algo falla, revisa
  `FRAME_SANDBOX` en `src/components/PopoutPanel.tsx`).
- El enlace de **Compartir** abierto en otro navegador importa los chats y deja la dirección limpia.

En otro hosting hay que configurar la misma reescritura a `index.html` ("SPA fallback") y las cabeceras.

## Seguridad

Los enlaces de grid se pueden compartir, así que se tratan como no confiables:

- **URLs** (`isSafeUrl` en `src/lib/config.ts`): solo `https:` de sitios públicos. Se rechazan `javascript:`/`data:`,
  credenciales en la URL (`https://twitch.tv@sitio-falso.com`), IPs privadas y red local, el propio dominio de la app
  (evita grids anidados sin fin) y URLs de más de 2000 caracteres. En local (`localhost`) se permiten `http:` y hosts locales para desarrollar.
- **Límites:** máximo 12 popouts por grid y nombres de 24 caracteres sin caracteres de control ni invisibles (bidi).
- **Iframes con `sandbox`** (`PopoutPanel.tsx`): los chats conservan scripts, cookies, formularios y popups de login,
  pero no pueden navegar la pestaña principal. Cada panel muestra el dominio real junto al nombre.
- **Cabeceras** (`vercel.json`): CSP estricta (sin `unsafe-inline`), `frame-ancestors 'none'` + `X-Frame-Options: DENY`
  (la app no se puede incrustar), COOP, HSTS y `Permissions-Policy`. `npm run preview` aplica las mismas cabeceras.

## Rendimiento

- **Preact** en lugar de React y un router propio de ~30 líneas: ~11 KB de JS comprimido en total.
- **Fuentes autoalojadas** (Geist vía `@fontsource`): solo caracteres latinos, servidas desde el mismo dominio
  y la principal precargada en el HTML.
- Los paneles fuera de vista cargan con `loading="lazy"` (en móvil); al maximizar uno, los demás se ocultan sin recargarse.
- **Íconos** de [Lucide](https://lucide.dev) (`lucide-preact`): solo se empaquetan los que se importan.
- **Animaciones** solo con CSS (sección "Animaciones" de `themes.css`): entrada escalonada con la variable `--i`,
  indicador de carga en cada panel, hover/press en botones y cambio de tema suave. Se desactivan solas si el sistema
  tiene activado "reducir movimiento".

> Preact sin `compat`: en los inputs de texto se usa `onInput` (no `onChange`), los atributos SVG van en
> kebab-case (`stroke-width`) y los tamaños numéricos en `style` llevan `px` explícito.

## Cómo funciona

1. En cada plataforma abre el chat (o lo que quieras) en ventana aparte y copia su link.
2. Pégalo en el configurador. Se le pone nombre y color automáticamente; puedes cambiarlos.
3. Abre el grid: cada popout es un panel con botones para recargar, abrir aparte, maximizar y quitar.

### Links que se adaptan solos

Algunos sitios bloquean su popout dentro de un iframe pero tienen una versión incrustable.
`src/lib/embeds.ts` traduce el link a esa versión:

| Plataforma | Link que puedes pegar | Se carga como |
| --- | --- | --- |
| Twitch | `twitch.tv/canal` o `twitch.tv/popout/canal/chat` | `twitch.tv/embed/canal/chat?parent=<tu dominio>` |
| YouTube | `youtube.com/watch?v=ID`, `/live/ID`, `youtu.be/ID` o `live_chat?v=ID` | `youtube.com/live_chat?v=ID&embed_domain=<tu dominio>` |
| Kick | `kick.com/canal` o `kick.com/popout/canal/chat` | `kick.com/popout/canal/chat` |
| Cualquier otro | — | Tal cual |

Si un sitio no permite incrustarse, el panel se verá en blanco o con un error: usa el botón ↗ del panel para abrirlo aparte.
Para agregar otra conversión, añade un caso en `resolvePopout()`.

### Grid responsivo

Columnas de al menos 320px que se reparten el ancho disponible. Cada fila usa el alto de la ventana
(mínimo 460px; si no caben, el grid hace scroll). En móvil queda una columna. Al maximizar un panel
los demás se ocultan sin desmontarse, así que no se desconectan.

### Rutas

- `/` — configurador.
- `/grid` — el grid con tus popouts.

La barra de direcciones nunca lleva los popouts: viven en `localStorage` (clave `<slug>:last-config`)
y se guardan al editarlos en el configurador o al quitar paneles. Si tienes el grid abierto en otra pestaña,
se actualiza solo. Nada sale del navegador.

### Compartir

En el configurador, **Compartir** copia un enlace con los popouts (`/grid?p=…&theme=…`). Quien lo abre los
importa a su navegador y la dirección se limpia al instante (`importSharedConfig` en `src/lib/config.ts`).
Un enlace sin popouts válidos no borra lo guardado. Los enlaces de versiones anteriores (`#/grid?p=…`,
`#/chat?c=…`) también se importan.

| Parámetro | Ejemplo | Qué hace |
| --- | --- | --- |
| `p` | `p=Nombre\|9146ff\|https://...` | Un popout (se repite, en orden; máximo 12) |
| `theme` | `light`, `system` | Tema (por defecto oscuro) |

## Estructura

```
src/
├── main.tsx                 # Arranque, fuentes y estilos
├── App.tsx                  # Rutas (/ y /grid)
├── pages/
│   ├── Configurator.tsx     # Agregar popouts, tema, distribución y enlace
│   └── GridView.tsx         # Grid responsivo de popouts
├── components/
│   ├── PopoutPanel.tsx      # Un panel: barra de acciones + iframe
│   └── ui.tsx               # Logo, badges, segmented, footer, íconos
├── hooks/
│   └── useResolvedTheme.ts
├── lib/
│   ├── brand.ts             # Nombre (desde .env) y créditos del footer
│   ├── router.ts            # Router mínimo (rutas / y /grid)
│   ├── config.ts            # URL ⇄ configuración
│   └── embeds.ts            # Link del popout → URL incrustable
└── styles/themes.css        # Tokens oscuro/claro y estilos
public/trenza-icon.svg       # Ícono de la app (favicon)
vercel.json                  # Caché y cabeceras para Vercel
```
