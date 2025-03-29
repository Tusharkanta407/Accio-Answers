import React from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Container,
} from '@mui/material';

const WaitingRoom = ({ player }) => {
  if (!player) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="400px"
      >
        <Typography variant="h5" gutterBottom>
          Loading...
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom>
          Waiting for an opponent...
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          You are: {player.name}
        </Typography>
        <CircularProgress size={60} />
        <Typography variant="body2" color="text.secondary" align="center">
          Please wait while we find you a worthy opponent!
        </Typography>
      </Paper>
    </Container>
  );
};

export default WaitingRoom; 