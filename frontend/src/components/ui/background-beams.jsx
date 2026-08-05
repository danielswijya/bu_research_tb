import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const PATHS = [
  'M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875',
  'M-340 -220C-340 -220 -272 185 192 312C656 439 724 844 724 844',
  'M-300 -250C-300 -250 -232 155 232 282C696 409 764 814 764 814',
  'M-260 -280C-260 -280 -192 125 272 252C736 379 804 784 804 784',
  'M-220 -310C-220 -310 -152 95 312 222C776 349 844 754 844 754',
  'M-180 -340C-180 -340 -112 65 352 192C816 319 884 724 884 724',
  'M-140 -370C-140 -370 -72 35 392 162C856 289 924 694 924 694',
  'M-100 -400C-100 -400 -32 5 432 132C896 259 964 664 964 664',
];

export const BackgroundBeams = React.memo(function BackgroundBeams({ className }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center opacity-40',
        className
      )}
    >
      <svg
        className="absolute z-0 h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {PATHS.map((path, index) => (
          <motion.path
            key={`beam-${index}`}
            d={path}
            stroke={`url(#clinical-beam-${index})`}
            strokeOpacity="0.35"
            strokeWidth="0.6"
            fill="none"
          />
        ))}
        <defs>
          {PATHS.map((_, index) => (
            <motion.linearGradient
              id={`clinical-beam-${index}`}
              key={`grad-${index}`}
              initial={{ x1: '0%', x2: '0%', y1: '0%', y2: '0%' }}
              animate={{
                x1: ['0%', '100%'],
                x2: ['0%', '95%'],
                y1: ['0%', '100%'],
                y2: ['0%', '90%'],
              }}
              transition={{
                duration: 12 + index,
                ease: 'easeInOut',
                repeat: Infinity,
                delay: index * 0.4,
              }}
            >
              <stop stopColor="#0f766e" stopOpacity="0" />
              <stop stopColor="#0d9488" />
              <stop offset="1" stopColor="#134e4a" stopOpacity="0" />
            </motion.linearGradient>
          ))}
        </defs>
      </svg>
    </div>
  );
});
