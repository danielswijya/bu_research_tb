import PropTypes from 'prop-types';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const iconSX = { fontSize: '1rem', color: 'inherit', marginLeft: 0, marginRight: 0 };

export default function TBDashboardStatCard({
  color = 'primary',
  title,
  count,
  previousCount,
  currentDateCount,
  subText
}) {
  // Calculate percentage change for Screenings/Positives only
  let percentage = null;
  let isLoss = false;
  if (
    (title === "Total Screenings" || title === "Total TB Positives") &&
    typeof currentDateCount === 'number' &&
    typeof previousCount === 'number' &&
    previousCount !== 0
  ) {
    percentage = +(((currentDateCount - previousCount) / previousCount) * 100).toFixed(1);
    isLoss = percentage < 0;
  }

  // Custom subText for Locations/Visits
  let displaySubText = subText;
  if (title === "Total Locations") {
    displaySubText = `You visited ${count} locations`;
  }
  if (title === "Total Visits") {
    displaySubText = `You visited ${count} visits`;
  }

  return (
    <Card variant="outlined" sx={{ p: 2.5, borderRadius: 5, minHeight: 120, paddingRight: 7 }}>
      <Stack sx={{ gap: 0.5 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        <Grid container alignItems="baseline" spacing={1}>
          <Grid item>
            <Typography variant="h5" color="inherit" sx={{ fontWeight: 700 }}>
              {typeof count === 'number' ? count.toLocaleString() : count}
            </Typography>
            {(title === "Total Screenings" || title === "Total TB Positives") && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                All-time total
              </Typography>
            )}
          </Grid>
          {percentage !== null && (
            <Grid item>
              <Chip
                variant="outlined"
                color={isLoss ? 'warning' : color}
                icon={isLoss ? <TrendingDownIcon sx={iconSX} /> : <TrendingUpIcon sx={iconSX} />}
                label={`${Math.abs(percentage)}%`}
                sx={{
                  ml: 1,
                  pl: 1,
                  fontWeight: 600,
                  fontSize: 14,
                  bgcolor: isLoss ? '#fbc02d22' : '#1976d222',
                  color: isLoss ? '#fbc02d' : '#1976d2',
                }}
                size="small"
              />
            </Grid>
          )}
        </Grid>
      </Stack>
      {displaySubText && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {displaySubText}
          </Typography>
        </Box>
      )}
    </Card>
  );
}

TBDashboardStatCard.propTypes = {
  color: PropTypes.string,
  title: PropTypes.string,
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  previousCount: PropTypes.number,
  currentDateCount: PropTypes.number,
  subText: PropTypes.string
};