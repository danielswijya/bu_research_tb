import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    primary: {
      main: '#0f766e',
      dark: '#134e4a',
      light: '#0d9488',
      contrastText: '#f0fdfa',
    },
    secondary: {
      main: '#334155',
    },
    error: {
      main: '#dc2626',
    },
    success: {
      main: '#059669',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Segoe UI", Inter, Roboto, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          transition: 'transform 140ms cubic-bezier(0.23, 1, 0.32, 1)',
          '&:active': { transform: 'scale(0.97)' },
        },
      },
    },
  },
});

export default theme;
