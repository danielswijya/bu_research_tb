import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const DIRECTIONS = ['TOP', 'LEFT', 'BOTTOM', 'RIGHT'];

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = 'button',
  duration = 1,
  clockwise = true,
  ...props
}) {
  const [hovered, setHovered] = useState(false);
  const [direction, setDirection] = useState('TOP');

  const rotateDirection = (current) => {
    const i = DIRECTIONS.indexOf(current);
    const next = clockwise
      ? (i - 1 + DIRECTIONS.length) % DIRECTIONS.length
      : (i + 1) % DIRECTIONS.length;
    return DIRECTIONS[next];
  };

  const movingMap = {
    TOP: 'radial-gradient(20.7% 50% at 50% 0%, #5eead4 0%, rgba(255,255,255,0) 100%)',
    LEFT: 'radial-gradient(16.6% 43.1% at 0% 50%, #5eead4 0%, rgba(255,255,255,0) 100%)',
    BOTTOM: 'radial-gradient(20.7% 50% at 50% 100%, #5eead4 0%, rgba(255,255,255,0) 100%)',
    RIGHT: 'radial-gradient(16.2% 41.2% at 100% 50%, #5eead4 0%, rgba(255,255,255,0) 100%)',
  };

  const highlight =
    'radial-gradient(75% 181% at 50% 50%, #0f766e 0%, rgba(255,255,255,0) 100%)';

  useEffect(() => {
    if (hovered) return undefined;
    const interval = setInterval(() => {
      setDirection((prev) => rotateDirection(prev));
    }, duration * 1000);
    return () => clearInterval(interval);
  }, [hovered, duration]);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative flex h-min w-full content-center items-center justify-center overflow-visible rounded-full border border-slate-200 bg-slate-100/40 p-px transition duration-300 pressable',
        containerClassName
      )}
      {...props}
    >
      <div
        className={cn(
          'z-10 w-full rounded-[inherit] bg-teal-800 px-4 py-2.5 text-center text-sm font-semibold text-teal-50',
          className
        )}
      >
        {children}
      </div>
      <motion.div
        className="absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit]"
        style={{ filter: 'blur(2px)' }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered ? [movingMap[direction], highlight] : movingMap[direction],
        }}
        transition={{ ease: 'linear', duration: duration ?? 1 }}
      />
      <div className="absolute inset-[1px] z-[1] rounded-[inherit] bg-white/90" />
    </Tag>
  );
}
