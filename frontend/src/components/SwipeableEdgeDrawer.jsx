import * as React from 'react';
import PropTypes from 'prop-types';
import { Global } from '@emotion/react';
import { styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CssBaseline from '@mui/material/CssBaseline';
import { grey } from '@mui/material/colors';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';

const drawerBleeding = 56;

const Root = styled('div')(({ theme }) => ({
  height: '100%',
  backgroundColor: grey[100],
  ...theme.applyStyles?.('dark', {
    backgroundColor: (theme.vars || theme).palette.background.default,
  }),
}));

const StyledBox = styled('div')(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.applyStyles?.('dark', {
    backgroundColor: grey[800],
  }),
}));

const Puller = styled('div')(({ theme }) => ({
  width: 30,
  height: 6,
  backgroundColor: grey[300],
  borderRadius: 3,
  position: 'absolute',
  top: 8,
  left: 'calc(50% - 15px)',
  ...theme.applyStyles?.('dark', {
    backgroundColor: grey[900],
  }),
}));

function SwipeableEdgeDrawer(props) {
  const { window } = props;
  const [open, setOpen] = React.useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Root>
      <CssBaseline />
      <Global
        styles={{
          '.MuiDrawer-root > .MuiPaper-root': {
            height: isMobile ? `calc(50% - ${drawerBleeding}px)` : '30%',
            maxWidth: isMobile ? '100%' : 600,
            margin: isMobile ? 0 : '0 auto',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            overflow: 'visible',
          },
        }}
      />

      {/* Persistent puller when closed */}
      {!open && (
    <Box
    onClick={toggleDrawer(true)}
    sx={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: isMobile ? '100%' : 600,
      zIndex: 1300,
      bgcolor: 'background.paper',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      boxShadow: 3,
      border: '1px solid',
      borderColor: theme => theme.palette.primary.light,
      px: 2,
      py: 1.5,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
    }}
    >
    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
        100 results
    </Typography>
    <Box
        sx={{
        width: 30,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme =>
        theme.palette.mode === 'dark' ? grey[900] : grey[400],
        }}
    />
    </Box>
)}



      <SwipeableDrawer
        container={container}
        anchor="bottom"
        open={open}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        swipeAreaWidth={drawerBleeding}
        disableSwipeToOpen={false}
        keepMounted
      >
        <StyledBox
          sx={{
            position: 'absolute',
            top: -drawerBleeding,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            visibility: 'visible',
            right: 0,
            left: 0,
            cursor: 'pointer',
          }}
          onClick={toggleDrawer(true)}
        >
          {isMobile && <Puller />}
          <Typography sx={{ p: 2, color: 'text.secondary' }}>100 results</Typography>
        </StyledBox>

        <StyledBox sx={{ px: 2, pb: 2, height: '100%', overflow: 'auto' }}>
          {/* Replace this with your list content later */}
          <Skeleton variant="rectangular" height="100%" />
        </StyledBox>
      </SwipeableDrawer>
    </Root>
  );
}

SwipeableEdgeDrawer.propTypes = {
  window: PropTypes.func,
};

export default SwipeableEdgeDrawer;
