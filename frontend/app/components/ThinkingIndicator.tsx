import { Box, Typography, keyframes } from '@mui/material';

const pulse = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
`;

export const ThinkingIndicator = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
    <Typography variant="body2" color="text.secondary" sx={{ animation: `${pulse} 1.5s infinite` }}>
      Agent Writing...
    </Typography>
  </Box>
);
