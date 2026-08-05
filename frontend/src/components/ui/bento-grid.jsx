import { cn } from '@/lib/utils';

export function BentoGrid({ className, children }) {
  return (
    <div
      className={cn(
        'mx-auto grid w-full grid-cols-1 gap-4 md:auto-rows-[10rem] md:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({ className, title, description, header, icon }) {
  return (
    <div
      className={cn(
        'group/bento row-span-1 flex flex-col justify-between space-y-3 rounded-xl border border-slate-200 bg-white p-4 transition duration-200 hover:shadow-md',
        className
      )}
    >
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-1">
        {icon}
        <div className="mt-2 mb-1 font-sans text-sm font-semibold text-slate-800">
          {title}
        </div>
        <div className="font-sans text-xs font-normal text-slate-500">
          {description}
        </div>
      </div>
    </div>
  );
}
