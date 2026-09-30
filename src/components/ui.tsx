import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Activity, Dumbbell, Flame, Waves, type LucideIcon } from 'lucide-react';
import type { Category } from '../types';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  strength: Dumbbell,
  stretch: Activity,
  swim: Waves,
  recovery: Flame,
};

/** Hex values for SVG strokes (Tailwind classes can't reach SVG attrs cleanly). */
export const HEX = {
  lime: '#C8F545',
  done: '#34D399',
  swim: '#38BDF8',
  stretch: '#A78BFA',
  heat: '#FBBF24',
  strength: '#FB923C',
  line: '#273140',
  dim: '#657386',
};
export const CATEGORY_HEX: Record<Category, string> = { strength: HEX.strength, stretch: HEX.stretch, swim: HEX.swim, recovery: HEX.heat };

export function Ring({
  size,
  progress,
  color,
  track = HEX.line,
  stroke = 4,
  dashed = false,
  children,
  label,
}: {
  size: number;
  progress: number;
  color: string;
  track?: string;
  stroke?: number;
  dashed?: boolean;
  children?: ReactNode;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div className="relative inline-grid place-items-center shrink-0" style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={dashed ? 1.5 : stroke} strokeDasharray={dashed ? '3 4' : undefined} />
        {p > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap={p < 1 ? 'round' : 'butt'}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - p)}
            style={{ transition: 'stroke-dashoffset 300ms ease-out' }}
          />
        )}
      </svg>
      <div className="relative grid place-items-center">{children}</div>
    </div>
  );
}

export function Chip({ children, className, icon: Icon }: { children: ReactNode; className?: string; icon?: LucideIcon }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap', className)}>
      {Icon && <Icon size={14} aria-hidden />}
      {children}
    </span>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'swim' | 'heat' | 'danger'; size?: 'lg' | 'md' | 'sm' };
export function Btn({ variant = 'secondary', size = 'md', className, children, ...rest }: BtnProps) {
  const v = {
    primary: 'bg-lime text-onlime',
    secondary: 'bg-line text-ink',
    ghost: 'text-lime',
    outline: 'border border-lime text-lime',
    swim: 'bg-swim text-onlime',
    heat: 'bg-heat text-onlime',
    danger: 'bg-warn/15 text-warn',
  }[variant];
  const s = { lg: 'h-16 rounded-[20px] text-lg', md: 'h-14 rounded-2xl text-base', sm: 'h-12 rounded-xl text-[15px]' }[size];
  return (
    <button
      type="button"
      className={cx('press inline-flex items-center justify-center gap-2.5 px-5 font-bold disabled:opacity-40 disabled:pointer-events-none', v, s, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconBtn({ label, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx('press grid h-12 w-12 shrink-0 place-items-center rounded-full', className)} {...rest}>
      {children}
    </button>
  );
}

export function IconTile({ category, size = 48 }: { category: Category; size?: number }) {
  const Icon = CATEGORY_ICON[category];
  const tint = { strength: 'bg-strength/15 text-strength', stretch: 'bg-stretch/15 text-stretch', swim: 'bg-swim/15 text-swim', recovery: 'bg-heat/15 text-heat' }[category];
  return (
    <span className={cx('grid shrink-0 place-items-center rounded-[14px]', tint)} style={{ width: size, height: size }} aria-hidden>
      <Icon size={Math.round(size / 2)} />
    </span>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('text-[11px] font-semibold tracking-[0.06em] uppercase text-muted', className)}>{children}</p>;
}

export function Sheet({ onClose, children, label }: { onClose: () => void; children: ReactNode; label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" aria-label="Close" className="anim-fade absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="anim-sheet relative max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[28px] bg-surf px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-2">
        <div className="flex h-5 items-center justify-center">
          <span className="h-1 w-8 rounded-full bg-dim" />
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-4" aria-live="polite">
      <div className="anim-rise rounded-2xl border border-line bg-surf2 px-4 py-3 text-sm font-medium shadow-2xl">{text}</div>
    </div>
  );
}
