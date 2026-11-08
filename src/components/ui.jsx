import { useEffect, useRef, useState } from 'react';
import { IconAlert, IconRefresh, IconX, IconTrash as IconTrashSmall } from './icons';
import { levelStyles } from '../lib/risk';

import { cx } from '../lib/cx';

/* ---------- Buttons ---------- */
const btnVariants = {
  primary: 'bg-brand text-brand-ink hover:brightness-110 shadow-sm',
  secondary: 'bg-surface text-ink border border-line hover:border-line-strong hover:bg-surface-2',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2',
  danger: 'bg-risk text-white hover:brightness-110',
};
const btnSizes = { sm: 'h-8 px-3 text-[13px] gap-1.5', md: 'h-10 px-4 text-sm gap-2', icon: 'h-9 w-9 justify-center' };

export function Button({ variant = 'primary', size = 'md', loading = false, className, children, disabled, ...rest }) {
  return (
    <button
      className={cx(
        'inline-flex items-center rounded-lg font-semibold transition-[background,filter,border-color,color] duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none',
        btnVariants[variant], btnSizes[size], className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={cx('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Surfaces ---------- */
export function Card({ className, children, as: Tag = 'section', ...rest }) {
  return (
    <Tag className={cx('bg-surface border border-line rounded-xl shadow-card', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {description && <p className="text-[13px] text-muted mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div className="min-w-0">
        <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.02em] text-ink">{title}</h1>
        {description && <p className="text-muted mt-1 max-w-[62ch]">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

/* ---------- Status ---------- */
export function LevelBadge({ level, children }) {
  const s = levelStyles[level] ?? levelStyles.ok;
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', s.soft, s.text)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', s.bg)} />
      {children}
    </span>
  );
}

export function Tag({ children, className }) {
  return (
    <span className={cx('inline-flex items-center rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted', className)}>
      {children}
    </span>
  );
}

// Horizontal risk meter: the signature element of ProSight.
// 20 segments; filled segments take the level colour.
export function SignalMeter({ score, level, animate = false, delay = 0 }) {
  const s = levelStyles[level] ?? levelStyles.ok;
  const filled = Math.round(score / 5);
  return (
    <div
      className="flex gap-[3px] h-2.5 w-full"
      role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={`Risk score ${score} of 100`}
    >
      {Array.from({ length: 20 }, (_, i) => (
        <span
          key={i}
          className={cx('flex-1 rounded-[2px]', i < filled ? s.bg : 'bg-line', animate && i < filled && 'gauge-fill')}
          style={animate ? { animationDelay: `${delay + i * 18}ms` } : undefined}
        />
      ))}
    </div>
  );
}

export function ProgressBar({ value, tone = 'brand', className }) {
  const tones = { brand: 'bg-brand', ok: 'bg-ok', watch: 'bg-watch', risk: 'bg-risk' };
  return (
    <div className={cx('h-1.5 w-full rounded-full bg-line overflow-hidden', className)}>
      <div className={cx('h-full rounded-full transition-[width] duration-500', tones[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ---------- Loading, empty, error ---------- */
export function Skeleton({ className }) {
  return <div className={cx('skeleton', className)} aria-hidden />;
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      {Icon && (
        <div className="h-11 w-11 rounded-xl bg-brand-soft text-brand flex items-center justify-center mb-3">
          <Icon size={22} />
        </div>
      )}
      <p className="font-bold text-ink">{title}</p>
      {children && <p className="text-sm text-muted mt-1 max-w-[44ch]">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <Card className="border-risk/40">
      <div className="flex flex-col sm:flex-row items-start gap-4 p-5">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-risk-soft text-risk flex items-center justify-center">
          <IconAlert size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-ink">Couldn't load this page</p>
          <p className="text-sm text-muted mt-0.5 break-words">{message}</p>
        </div>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={() => onRetry()}>
            <IconRefresh size={15} /> Try again
          </Button>
        )}
      </div>
    </Card>
  );
}

/* ---------- Forms ---------- */
const fieldBase = 'w-full h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-faint outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-3 focus:ring-brand/20';

export function Field({ label, hint, children, className }) {
  return (
    <label className={cx('block', className)}>
      <span className="block text-[13px] font-semibold text-ink mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  );
}
export function Input({ className, ...rest }) {
  return <input className={cx(fieldBase, className)} {...rest} />;
}
export function Select({ className, children, ...rest }) {
  return <select className={cx(fieldBase, 'cursor-pointer pr-8', className)} {...rest}>{children}</select>;
}
export function Textarea({ className, ...rest }) {
  return <textarea className={cx(fieldBase, 'h-auto py-2 min-h-[72px] resize-y', className)} {...rest} />;
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the first field so the user can start typing straight away.
    const t = setTimeout(() => panel.current?.querySelector('input, select, textarea, button')?.focus(), 30);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; clearTimeout(t); };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg' };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-[#070a12]/60 backdrop-blur-[2px] animate-fade" onClick={onClose} />
      <div
        ref={panel} role="dialog" aria-modal="true" aria-label={title}
        className={cx('relative w-full bg-surface border border-line rounded-t-2xl sm:rounded-2xl shadow-2xl animate-pop max-h-[92vh] flex flex-col', widths[size])}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-2">
          <div>
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="-mr-2 p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-2 cursor-pointer" aria-label="Close">
            <IconX />
          </button>
        </div>
        <div className="px-6 py-3 overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 pb-5 pt-3">{footer}</div>}
      </div>
    </div>
  );
}

/* Two-step delete: first click arms it, second click confirms. No browser popups. */
export function ConfirmDelete({ onConfirm, label = 'Delete', className, size = 15 }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return armed ? (
    <button
      onClick={(e) => { e.stopPropagation(); setArmed(false); onConfirm(); }}
      className={cx('rounded-md bg-risk px-2 py-1 text-[11px] font-bold text-white cursor-pointer', className)}
    >
      Confirm
    </button>
  ) : (
    <button
      onClick={(e) => { e.stopPropagation(); setArmed(true); }}
      className={cx('rounded-md p-1 text-faint hover:text-risk hover:bg-risk-soft cursor-pointer', className)}
      aria-label={label} title={label}
    >
      <IconTrashSmall size={size} />
    </button>
  );
}

/* ---------- Avatar: a stable colour per name ---------- */
const AVATAR_TONES = [
  'bg-[#e8ecff] text-[#3d5afe]', 'bg-[#e1f5ee] text-[#0f8a6b]', 'bg-[#fdf1dc] text-[#a86a08]',
  'bg-[#f3e8ff] text-[#7c3aed]', 'bg-[#fde6e6] text-[#c2343a]',
];
export function Avatar({ name = '', size = 'md', className }) {
  const tone = AVATAR_TONES[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  const sizes = { xs: 'h-5 w-5 text-[10px]', sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-11 w-11 text-base' };
  return (
    <span className={cx('shrink-0 rounded-full inline-flex items-center justify-center font-bold', tone, sizes[size], className)} title={name} aria-hidden>
      {name.charAt(0).toUpperCase() || '?'}
    </span>
  );
}
