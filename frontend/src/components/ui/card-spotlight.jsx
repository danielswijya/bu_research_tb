import { useMotionValue, motion, useMotionTemplate } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Aceternity Card Spotlight — radial spotlight only (no Three.js canvas)
 * so virtualized location lists stay performant.
 */
export function CardSpotlight({
  children,
  radius = 280,
  color = 'rgba(15, 118, 110, 0.14)',
  className,
  ...props
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const maskImage = useMotionTemplate`
    radial-gradient(
      ${radius}px circle at ${mouseX}px ${mouseY}px,
      white,
      transparent 80%
    )
  `;

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        'group/spotlight relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3',
        className
      )}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover/spotlight:opacity-100"
        style={{
          backgroundColor: color,
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
