import React from 'react';
import {
  Drawer, Toolbar, List, ListItem, ListItemIcon, ListItemText, Avatar, Typography
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import LayersIcon from '@mui/icons-material/Layers';
import DescriptionIcon from '@mui/icons-material/Description';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const drawerWidth = 240;

export default function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#fff',
          borderRight: '1px solid #e5e7eb',
          top: '64px', // Pushes the drawer down by the height of the AppBar
          height: 'calc(100vh - 59px)', // Makes the drawer fill the remaining height
        },
      }}
    >
      <List>
        <ListItem button selected>
          <ListItemIcon><DashboardIcon color="primary" /></ListItemIcon>
          <ListItemText primary="Statistics" />
        </ListItem>
      </List>
    </Drawer>
  );
}