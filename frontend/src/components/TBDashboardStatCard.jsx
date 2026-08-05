import PropTypes from 'prop-types';
import Chip from '@mui/material/Chip';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { BentoGridItem } from '@/components/ui/bento-grid';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import { GlowingEffect } from '@/components/ui/glowing-effect';

const iconSX = { fontSize: '1rem', color: 'inherit', marginLeft: 0, marginRight: 0 };

export default function TBDashboardStatCard({
  title,
  count,
  previousCount,
  currentDateCount,
  subText,
}) {
  let percentage = null;
  let isLoss = false;
  if (
    (title === 'Total Screenings' || title === 'Total TB Positives') &&
    typeof currentDateCount === 'number' &&
    typeof previousCount === 'number' &&
    previousCount !== 0
  ) {
    percentage = +(((currentDateCount - previousCount) / previousCount) * 100).toFixed(1);
    isLoss = percentage < 0;
  }

  let displaySubText = subText;
  if (title === 'Total Locations') {
    displaySubText = `You visited ${count} locations`;
  }
  if (title === 'Total Visits') {
    displaySubText = `You visited ${count} visits`;
  }

  return (
    <GlowingEffect>
      <CardSpotlight className="h-full min-h-[8.5rem] border-slate-200 p-0">
        <BentoGridItem
          className="border-0 shadow-none hover:shadow-none dark:bg-transparent"
          title={title}
          description={displaySubText}
          header={
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {typeof count === 'number' ? count.toLocaleString() : count}
              </span>
              {percentage !== null && (
                <Chip
                  variant="outlined"
                  color={isLoss ? 'warning' : 'success'}
                  icon={
                    isLoss ? (
                      <TrendingDownIcon sx={iconSX} />
                    ) : (
                      <TrendingUpIcon sx={iconSX} />
                    )
                  }
                  label={`${Math.abs(percentage)}%`}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: isLoss ? '#fef3c7' : '#ccfbf1',
                    color: isLoss ? '#b45309' : '#0f766e',
                    borderColor: 'transparent',
                  }}
                />
              )}
            </div>
          }
        />
      </CardSpotlight>
    </GlowingEffect>
  );
}

TBDashboardStatCard.propTypes = {
  title: PropTypes.string,
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  previousCount: PropTypes.number,
  currentDateCount: PropTypes.number,
  subText: PropTypes.string,
};
