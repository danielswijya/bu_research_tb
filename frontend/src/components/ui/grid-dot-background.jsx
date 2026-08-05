import { cn } from '@/lib/utils';

/** Aceternity Grid and Dot Backgrounds — clinical quiet variant. */
export function GridDotBackground({ className, children }) {
  return (
    <div className={cn('relative min-h-full w-full bg-slate-50', className)}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(15, 118, 110, 0.12) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/70 via-transparent to-slate-50/90" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
