import { useState } from 'react';
import { Checkbox, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';
import MethodBadges from './ScreeningMethodBadge';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import { cn } from '@/lib/utils';

export default function LocationResultCard({
  entry,
  isSelected,
  isHighlighted,
  onToggle,
  onFocus,
  style,
}) {
  const [expanded, setExpanded] = useState(false);
  const yieldRatio =
    entry.total_screened > 0
      ? (entry.total_diagnosed / entry.total_screened) * 100
      : 0;

  return (
    <div style={style} className="px-1 pb-2">
      <CardSpotlight
        className={cn(
          'cursor-pointer p-3 transition-[box-shadow,border-color] duration-200 pressable',
          isSelected && 'border-teal-600 ring-2 ring-teal-600/25',
          isHighlighted && !isSelected && 'border-l-4 border-l-teal-600'
        )}
        onClick={() => {
          onToggle?.(entry.markerKey);
          onFocus?.(entry);
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <MethodBadges methods={entry.methods} />
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {entry.banditRank != null && (
                <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800 ring-1 ring-teal-700/15">
                  #{entry.banditRank}
                </span>
              )}
              <Typography
                variant="body2"
                className="!font-semibold !text-slate-900"
                sx={{ wordBreak: 'break-word', mr: 1 }}
              >
                {entry.location_name || 'Unknown'}
              </Typography>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {entry.Zona_name || 'N/A'} · {entry.District || 'N/A'}
            </p>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          >
            <Checkbox
              size="small"
              checked={isSelected}
              onChange={() => onToggle?.(entry.markerKey)}
              sx={{ color: '#0f766e', '&.Mui-checked': { color: '#0f766e' } }}
            />
          </div>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <Metric label="Screened" value={entry.total_screened} />
          <Metric label="Diagnosed" value={entry.total_diagnosed} />
          <Metric label="Yield" value={`${yieldRatio.toFixed(1)}%`} emphasize />
        </div>

        <button
          type="button"
          className="mt-2 text-xs font-medium text-teal-700 hover:text-teal-900"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
                {entry.banditPriority != null && (
                  <p>
                    Model weight:{' '}
                    <span className="font-medium text-slate-800">
                      {(entry.banditPriority * 100).toFixed(2)}%
                    </span>
                  </p>
                )}
                <p>
                  Performed by:{' '}
                  {[...(entry.methods || [])].join(', ') || 'N/A'}
                </p>
                <p>Date: {entry.Date || 'N/A'}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardSpotlight>
    </div>
  );
}

function Metric({ label, value, emphasize }) {
  return (
    <div className="rounded-lg bg-slate-50 px-1 py-1.5">
      <div
        className={cn(
          'text-sm font-semibold',
          emphasize ? 'text-teal-800' : 'text-slate-800'
        )}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </div>
    </div>
  );
}
