import type { ComponentChildren } from 'preact';
import { APP_CREDITS } from '../lib/brand';

/** Ícono de la app (tigre): public/el-nexo-tigre.svg. */
export function Logo({ size = 28 }: { size?: number }) {
  return <img className="logo" src="/el-nexo-tigre.svg" width={size} height={size} alt="" />;
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

/** Créditos fijos al pie de todas las páginas. */
export function SiteFooter() {
  return <footer className="site-footer">{APP_CREDITS}</footer>;
}
