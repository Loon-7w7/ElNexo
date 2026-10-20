import { ChevronDown, ExternalLink, KeyRound, LockKeyhole, TriangleAlert, X } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { APP_NAME, APP_SLUG } from '../lib/brand';

/** Aviso sobre inicios de sesión dentro de los chats: franja en el grid y tarjeta en el configurador. */

const DISMISS_KEY = `${APP_SLUG}:login-notice-dismissed`;

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function SolutionSteps() {
  return (
    <ol className="notice-steps">
      <li>
        <strong>Inicia sesión dentro del chat.</strong> Casi siempre funciona y queda guardado para ese chat en {APP_NAME}.
      </li>
      <li>
        <strong>Ábrelo aparte</strong> con el botón <ExternalLink size={12} /> del chat si el sitio no deja iniciar sesión
        dentro de otra página.
      </li>
    </ol>
  );
}

function DomainWarning() {
  return (
    <p className="notice-warning">
      <TriangleAlert size={14} />
      <span>
        Escribe tu contraseña solo si el dominio que aparece junto al nombre del chat es el del sitio real. El nombre lo puede
        poner cualquiera en un enlace compartido; el dominio no se puede falsear.
      </span>
    </p>
  );
}

/** Franja breve sobre los chats del grid. Se puede cerrar y no vuelve a salir. */
export function LoginBanner() {
  const [hidden, setHidden] = useState(wasDismissed);
  const [open, setOpen] = useState(false);
  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* sin almacenamiento: se oculta solo en esta visita */
    }
  };

  return (
    <aside className="notice-banner rise" aria-label="Aviso sobre inicios de sesión">
      <div className="notice-banner-row">
        <KeyRound size={16} class="notice-icon" />
        <p>
          <strong>¿Un chat te pide iniciar sesión?</strong> Es normal: el navegador separa las sesiones de los sitios
          incrustados. {APP_NAME} no ve tus datos de acceso.
        </p>
        <button type="button" className="btn soft small" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          Cómo solucionarlo <ChevronDown size={14} class={open ? 'chevron open' : 'chevron'} />
        </button>
        <button type="button" className="icon-btn tiny" aria-label="Cerrar aviso" title="Entendido" onClick={dismiss}>
          <X size={14} />
        </button>
      </div>
      {open && (
        <div className="notice-details rise">
          <SolutionSteps />
          <DomainWarning />
        </div>
      )}
    </aside>
  );
}

/** Explicación completa, fija en el configurador. */
export function LoginInfoCard({ style }: { style?: Record<string, string> }) {
  return (
    <section className="card rise" style={style}>
      <div className="card-head">
        <div className="card-title">
          <LockKeyhole size={16} class="card-icon" />
          <h2>Inicio de sesión y privacidad</h2>
        </div>
      </div>
      <div className="notice-card">
        <p>
          Algunos chats piden iniciar sesión aunque ya la tengas abierta en otra pestaña. No es un error de {APP_NAME}: los
          navegadores tratan las cookies de un sitio incrustado como <em>cookies de terceros</em> y las bloquean o separan.
        </p>

        <h3>{APP_NAME} no tiene acceso a tus inicios de sesión</h3>
        <ul className="notice-list">
          <li>Cada chat se carga aislado: la app no puede ver tu usuario, tu contraseña, tus cookies ni lo que escribes.</li>
          <li>No hay servidor: no existe ningún lugar al que se pueda mandar tu información.</li>
          <li>Lo único que se guarda, y solo en tu navegador, es la lista de chats: nombre, color y link.</li>
        </ul>

        <h3>Cómo solucionarlo</h3>
        <SolutionSteps />
        <DomainWarning />
      </div>
    </section>
  );
}
