import React from 'react';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material';
import MapPage from './pages/MapPage';
import TicketsPage from './pages/Tickets';

export default function App() {
  const [tabIndex, setTabIndex] = React.useState(0);

  const handleChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            TB Tracker System - BU Public Health
          </Typography>
          <Tabs value={tabIndex} onChange={handleChange} textColor="primary" indicatorColor="primary">
            <Tab label="Map" />
            <Tab label="Tickets" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box sx={{ mt: 0 }}>
        {tabIndex === 0 && <MapPage />}
        {tabIndex === 1 && <TicketsPage />}
      </Box>
    </>
  );
}
