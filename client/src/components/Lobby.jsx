import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
} from '@mui/material';

const Lobby = ({ onJoinQueue }) => {
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onJoinQueue(playerName.trim());
    }
  };

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
        <Typography variant="h4" component="h1" gutterBottom>
          Trivia Game
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          Enter your name to join the queue and find an opponent!
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            label="Your Name"
            variant="outlined"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={!playerName.trim()}
          >
            Join Queue
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Lobby; 