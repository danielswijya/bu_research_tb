import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from 'motion/react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

export function MovingBorderButton({
  borderRadius = '1rem',
  children,
  as: Component = 'button',
  containerClassName,
  borderClassName,
  duration = 3000,
  className,
  ...otherProps
}) {
  return (
    <Component
      className={cn(
        'relative h-11 w-full overflow-hidden bg-transparent p-[1px] text-sm pressable',
        containerClassName
      )}
      style={{ borderRadius }}
      type={Component === 'button' ? 'button' : undefined}
      {...otherProps}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div
            className={cn(
              'h-16 w-16 bg-[radial-gradient(#0d9488_40%,transparent_60%)] opacity-80',
              borderClassName
            )}
          />
        </MovingBorder>
      </div>
      <div
        className={cn(
          'relative flex h-full w-full items-center justify-center border border-teal-800/20 bg-teal-800 text-sm font-semibold text-teal-50 antialiased',
          className
        )}
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        {children}
      </div>
    </Component>
  );
}

export function MovingBorder({ children, duration = 3000, rx, ry, ...otherProps }) {
  const pathRef = useRef(null);
  const progress = useMotionValue(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength?.();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val)?.x ?? 0);
  const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val)?.y ?? 0);
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
      </svg>
      <motion.div style={{ position: 'absolute', top: 0, left: 0, display: 'inline-block', transform }}>
        {children}
      </motion.div>
    </>
  );
}
