import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/** Aceternity Animated Tabs — adapted for controlled Map/Dashboard switching. */
export function AnimatedTabs({
  tabs,
  activeValue,
  onChange,
  containerClassName,
  activeTabClassName,
  tabClassName,
}) {
  const [active, setActive] = useState(activeValue ?? tabs[0]?.value);

  useEffect(() => {
    if (activeValue != null) setActive(activeValue);
  }, [activeValue]);

  return (
    <div
      className={cn(
        'relative flex w-fit flex-row items-center rounded-full bg-slate-100/90 p-1',
        containerClassName
      )}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setActive(tab.value);
              onChange?.(tab.value);
            }}
            className={cn(
              'relative rounded-full px-4 py-1.5 text-sm font-semibold text-slate-600 transition-colors pressable',
              isActive && 'text-teal-900',
              tabClassName
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-tab-pill"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                className={cn(
                  'absolute inset-0 rounded-full bg-white shadow-sm ring-1 ring-teal-700/15',
                  activeTabClassName
                )}
              />
            )}
            <span className="relative z-10">{tab.title}</span>
          </button>
        );
      })}
    </div>
  );
}
