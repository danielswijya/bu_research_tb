import PropTypes from 'prop-types';
import { useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { LineChart } from '@mui/x-charts/LineChart';

const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function Legend({ items, onToggle }) {
  return (
    <Stack direction="row" sx={{ gap: 2, alignItems: 'center', justifyContent: 'center', mt: 2.5, mb: 1.5 }}>
      {items.map((item) => (
        <Stack
          key={item.label}
          direction="row"
          sx={{ gap: 1.25, alignItems: 'center', cursor: 'pointer' }}
          onClick={() => onToggle(item.label)}
        >
          <Box sx={{ width: 12, height: 12, bgcolor: item.visible ? item.color : 'grey.500', borderRadius: '50%' }} />
          <Typography variant="body2" color="text.primary" sx={{ fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

Legend.propTypes = { items: PropTypes.array, onToggle: PropTypes.func };

export default function TBAnalyticsLineChart({ monthlyScreenings, monthlyPositives }) {
  const theme = useTheme();
  const [visibility, setVisibility] = useState({
    'Screenings': true,
    'Positives': true
  });

  const toggleVisibility = (label) => {
    setVisibility((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const visibleSeries = [
    {
      data: monthlyScreenings,
      label: 'Screenings',
      showMark: false,
      area: true,
      id: 'Screenings',
      color: theme.palette.primary.main,
      visible: visibility['Screenings']
    },
    {
      data: monthlyPositives,
      label: 'Positives',
      showMark: false,
      area: true,
      id: 'Positives',
      color: theme.palette.error.main,
      visible: visibility['Positives']
    }
  ];

  const axisFontStyle = { fontSize: 12, fill: theme.palette.text.secondary, fontFamily: 'Inter, Roboto, Arial, sans-serif' };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRight: '1px solid #e5e7eb',
        borderRadius: 10,
        bgcolor: '#fff',
        p: 3,
        height: 480,
        width: 700,
        minWidth: 0,
        minHeight: 480,
        fontFamily: 'Inter, Roboto, Arial, sans-serif',
      }}
    >
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Grid item>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
            Screenings & Positives Over Time
          </Typography>
        </Grid>
      </Grid>
      <LineChart
        hideLegend
        grid={{ horizontal: true }}
        xAxis={[{ scaleType: 'point', data: monthlyLabels, disableLine: true, tickLabelStyle: axisFontStyle }]}
        yAxis={[{ disableLine: true, disableTicks: true, tickLabelStyle: axisFontStyle }]}
        height={350}
        margin={{ top: 40, bottom: 10, right: 20, left: 5 }}
        series={visibleSeries
          .filter((series) => series.visible)
          .map((series) => ({
            type: 'line',
            data: series.data,
            label: series.label,
            showMark: series.showMark,
            area: series.area,
            id: series.id,
            color: series.color,
            stroke: series.color,
            strokeWidth: 2
          }))}
        sx={{
          '& .MuiAreaElement-series-Screenings': { fill: "url('#myGradient1')", strokeWidth: 2, opacity: 0.8 },
          '& .MuiAreaElement-series-Positives': { fill: "url('#myGradient2')", strokeWidth: 2, opacity: 0.8 },
          '& .MuiChartsAxis-directionX .MuiChartsAxis-tick': { stroke: theme.palette.divider }
        }}
      >
        <defs>
          <linearGradient id="myGradient1" gradientTransform="rotate(90)">
            <stop offset="10%" stopColor={alpha(theme.palette.primary.main, 0.4)} />
            <stop offset="90%" stopColor={alpha(theme.palette.background.default, 0.4)} />
          </linearGradient>
          <linearGradient id="myGradient2" gradientTransform="rotate(90)">
            <stop offset="10%" stopColor={alpha(theme.palette.error.main, 0.4)} />
            <stop offset="90%" stopColor={alpha(theme.palette.background.default, 0.4)} />
          </linearGradient>
        </defs>
      </LineChart>
      <Legend items={visibleSeries} onToggle={toggleVisibility} />
    </Paper>
  );
}

TBAnalyticsLineChart.propTypes = {
  monthlyScreenings: PropTypes.array.isRequired,
  monthlyPositives: PropTypes.array.isRequired
};