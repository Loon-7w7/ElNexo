import { X } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';
import { APP_CREDITS } from '../lib/brand';
import { KNOWN_PLATFORMS, type KnownPlatform } from '../lib/platforms';

/** Ícono de la app (tigre): public/el-nexo-tigre.svg. */
export function Logo({ size = 28 }: { size?: number }) {
  return <img className="logo" src="/el-nexo-tigre.svg" width={size} height={size} alt="" />;
}

/** Ícono de la plataforma (public/<plataforma>.svg). */
export function PlatformIcon({ platform, size = 16 }: { platform: KnownPlatform; size?: number }) {
  return <img className="platform-icon" src={KNOWN_PLATFORMS[platform].icon} width={size} height={size} alt="" />;
}

export function TagBadge({ tag, color, fg = '#0a0a0f', size = 34 }: { tag: string; color: string; fg?: string; size?: number }) {
  return (
    <span
      className="platform-badge"
      style={{ width: `${size}px`, height: `${size}px`, background: color, color: fg, fontSize: '12px', borderRadius: '9px' }}
    >
      {tag}
    </span>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ComponentChildren }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="segmented">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Ventana modal sobre <dialog>: el navegador se encarga del foco, de Escape y de bloquear la página.
 * Se cierra también al hacer clic fuera del contenido.
 */
export function Modal({
  open,
  onClose,
  title,
  icon,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ComponentChildren;
  footer?: ComponentChildren;
  children: ComponentChildren;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <div className="card-head">
          <div className="card-title">
            {icon}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button type="button" className="icon-btn tiny" aria-label="Cerrar" title="Cerrar" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </dialog>
  );
}

/** Créditos fijos al pie de todas las páginas. */
export function SiteFooter() {
  return <footer className="site-footer">{APP_CREDITS}</footer>;
}
