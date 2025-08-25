import React from 'react';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, height: '100vh', overflow: 'auto' }}>
        <AppBar
          position="static"
          elevation={0}
          sx={{ bgcolor: '#fff', color: '#222', borderBottom: '1px solid #e5e7eb' }}
        >
        </AppBar>
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}