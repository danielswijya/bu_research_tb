import { cn } from '@/lib/utils';

/**
 * Aceternity Floating Navbar — adapted as a sticky clinical app header
 * (always visible for field-tool usability; Map/Dashboard via children).
 */
export function FloatingNav({ className, children, brand }) {
  return (
    <header
      className={cn(
        'sticky top-0 z-[5000] w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md',
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">{brand}</div>
        <div className="flex shrink-0 items-center gap-3">{children}</div>
      </div>
    </header>
  );
}
