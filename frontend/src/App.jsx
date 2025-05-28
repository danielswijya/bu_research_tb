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
      <AppBar position="static" color='default' elevation={1}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Box component= "img" src='/images/bu-sph.png' alt='BU School of Public Health' sx={{height: 48, width: 'auto', marginRight:2, borderRadius : 1,}} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
            x TB Tracker System
          </Typography>
          <Tabs value={tabIndex} onChange={handleChange} textColor="primary" indicatorColor="primary">
            <Tab label="Map" />
            <Tab label="Confirmed Locations" />
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
