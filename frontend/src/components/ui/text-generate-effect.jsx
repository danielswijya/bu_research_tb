import { useEffect } from 'react';
import { motion, stagger, useAnimate } from 'motion/react';
import { cn } from '@/lib/utils';

export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.4,
}) {
  const [scope, animate] = useAnimate();
  const wordsArray = words.split(' ');

  useEffect(() => {
    animate(
      'span',
      {
        opacity: 1,
        filter: filter ? 'blur(0px)' : 'none',
      },
      {
        duration: duration ?? 0.5,
        delay: stagger(0.12),
      }
    );
  }, [animate, duration, filter]);

  return (
    <div className={cn('font-bold', className)}>
      <motion.div ref={scope} className="inline">
        {wordsArray.map((word, idx) => (
          <motion.span
            key={`${word}-${idx}`}
            className="text-slate-900 opacity-0"
            style={{ filter: filter ? 'blur(8px)' : 'none' }}
          >
            {word}{' '}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
