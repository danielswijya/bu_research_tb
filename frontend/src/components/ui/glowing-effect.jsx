import { cn } from '@/lib/utils';

/** Aceternity Glowing Effect — restrained teal border glow for containers. */
export function GlowingEffect({ className, children, active = true }) {
  return (
    <div className={cn('relative rounded-xl', className)}>
      {active && (
        <div
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-70"
          style={{
            background:
              'linear-gradient(135deg, rgba(15,118,110,0.35), transparent 40%, rgba(13,148,136,0.25))',
          }}
        />
      )}
      <div className="relative rounded-[inherit] bg-white">{children}</div>
    </div>
  );
}
