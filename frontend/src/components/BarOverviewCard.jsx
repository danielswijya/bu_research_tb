import PropTypes from 'prop-types';
import { Paper, Typography, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';

export default function BarOverviewCard({ screeningDates, yieldRates }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        bgcolor: '#fff',
        p: 3,
        height: 480,
        width: 350,
        minWidth: 20,
        minHeight: 480,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, Roboto, Arial, sans-serif'
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontFamily: 'Inter, Roboto, Arial, sans-serif',
          mb: 2
        }}
      >
        Screening Yield Rates
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontFamily: 'Inter, Roboto, Arial, sans-serif',
          mb: 1
        }}
      >
        Positives / Screened per Date
      </Typography>
      <Box sx={{ flex: 1, width: '100%' }}>
        <BarChart
          xAxis={[{ scaleType: 'band', data: screeningDates, tickLabelStyle: { fontFamily: 'Inter, Roboto, Arial, sans-serif', fontSize: 10 } }]}
          series={[{ data: yieldRates, color: '#4dd0e1' }]}
          height={280}
          margin={{ top: 10, bottom: 30, left: 10, right: 10 }}
          grid={{ horizontal: true }}
        />
      </Box>
    </Paper>
  );
}

BarOverviewCard.propTypes = {
  screeningDates: PropTypes.array.isRequired,
  yieldRates: PropTypes.array.isRequired
};