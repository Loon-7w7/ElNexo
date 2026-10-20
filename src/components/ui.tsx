import type { ComponentChildren } from 'preact';
import { APP_CREDITS } from '../lib/brand';

/** Ícono de la app (trenza): el mismo dibujo que public/trenza-icon.svg. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <rect width="512" height="512" rx="112" fill="#14121c" />
      <path
        d="M136 120h240a52 52 0 0 1 52 52v144a52 52 0 0 1-52 52H248l-70 60v-60h-42a52 52 0 0 1-52-52V172a52 52 0 0 1 52-52z"
        fill="#241f38"
      />
      <g fill="none" stroke-width="26" stroke-linecap="round">
        <path className="strand" pathLength={1} d="M150 190C238 190 262 244 362 244" stroke="#9146FF" />
        <path className="strand" pathLength={1} d="M150 298C238 298 262 244 362 244" stroke="#FF3B3B" />
        <path className="strand" pathLength={1} d="M150 244H362" stroke="#53FC18" />
      </g>
      <circle cx="362" cy="244" r="20" fill="#f4f1ff" />
    </svg>
  );
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
