import { Box, Tooltip } from '@mui/material';
import BackpackIcon from '@mui/icons-material/Backpack';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

export default function MethodBadges({ methods }) {
  return (
    <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: '5px', zIndex: 20 }}>
      {[...(methods || [])].map((method, i) => {
        const isBackpack = method.toLowerCase().includes('backpack');
        const isMobile = method.toLowerCase().includes('mobile');
        const Icon = isBackpack ? BackpackIcon : isMobile ? LocalShippingIcon : null;
        const bgColor = isBackpack ? 'orange' : isMobile ? 'darkblue' : 'gray';

        return Icon ? (
          <Tooltip title={method} key={i}>
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ color: 'white', fontSize: 14 }} />
            </Box>
          </Tooltip>
        ) : null;
      })}
    </Box>
  );
}
