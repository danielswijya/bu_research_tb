import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/** Aceternity Placeholders And Vanish Input — search-focused (live onChange, no vanish clear). */
export function PlaceholdersAndVanishInput({
  placeholders = [],
  value,
  onChange,
  onSubmit,
  className,
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!placeholders.length) return undefined;
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [placeholders]);

  return (
    <form
      className={cn(
        'relative mx-auto h-11 w-full overflow-hidden rounded-full bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.08),0px_0px_0px_1px_rgba(15,23,42,0.06)] transition duration-200',
        className
      )}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(e);
      }}
    >
      <input
        value={value}
        onChange={onChange}
        type="text"
        className="relative z-50 h-full w-full rounded-full border-none bg-transparent pl-4 pr-12 text-sm text-slate-900 outline-none focus:ring-0"
      />
      <button
        type="submit"
        className="absolute top-1/2 right-2 z-50 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-teal-800 text-teal-50 transition duration-200 pressable disabled:bg-slate-200 disabled:text-slate-400"
        disabled={!value}
        aria-label="Search"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </button>
      <div className="pointer-events-none absolute inset-0 flex items-center rounded-full">
        <AnimatePresence mode="wait">
          {!value && placeholders.length > 0 && (
            <motion.p
              initial={{ y: 5, opacity: 0 }}
              key={`ph-${currentPlaceholder}`}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="truncate pl-4 text-left text-sm text-slate-400"
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
