# Cambios

Todos los cambios importantes de El Nexo quedan anotados aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y las versiones usan [SemVer](https://semver.org/lang/es/).

## [1.1.0] — 2026-10-25

### Cambiado

- **Nuevo ícono**: el tigre de El Nexo reemplaza a la trenza en la pestaña del navegador, en la barra superior y en
  el README.

## [1.0.0] — 2026-10-19

Primera versión pública.

### Agregado

- **Grid de chats responsivo**: junta los chats de cualquier plataforma en una sola pestaña. Las columnas se reparten
  el ancho de la pantalla y en móvil quedan una debajo de otra.
- **Cualquier plataforma**: pegas el link del chat y listo. Twitch, YouTube y Kick se adaptan solos a su versión
  incrustable; cualquier otro sitio se carga tal cual.
- **Acciones por chat**: recargar, abrir en otra ventana, maximizar (Esc para volver) y quitar, sin recargar los demás.
- **Configurador** con nombre y color sugeridos para cada chat, vista previa de la distribución y tema oscuro, claro
  o del sistema.
- **Guardado en el navegador** (`localStorage`): la dirección queda limpia (`/` y `/grid`) y el grid se sincroniza
  si lo editas en otra pestaña.
- **Compartir**: un enlace con tus chats que, al abrirlo, se importa al navegador de la otra persona.
- **Aviso de inicio de sesión** en el grid y en el configurador: explica por qué un chat puede pedir iniciar sesión
  y que la app no tiene acceso a tus datos.
- **Seguridad**: chats aislados con `sandbox`, validación estricta de links (solo `https` de sitios públicos, sin
  credenciales ni red local), máximo 12 chats, CSP estricta y la app no se puede incrustar en otras páginas.
- **Animaciones** suaves solo con CSS que respetan "reducir movimiento", e íconos de Lucide.
- Botón de donaciones a Ko-fi y créditos de Producciones Alpeka/LonyArts.
- Lista para publicar en Vercel (plan gratuito): `vercel.json` con reescritura de rutas, caché y cabeceras.

[1.1.0]: https://github.com/Loon-7w7/ElNexo/releases/tag/v1.1.0
[1.0.0]: https://github.com/Loon-7w7/ElNexo/releases/tag/v1.0.0
