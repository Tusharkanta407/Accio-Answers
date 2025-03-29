import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Container,
  LinearProgress,
  CircularProgress,
} from '@mui/material';

const Game = ({ game, player, onAnswer, isGameEnded }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (!isGameEnded && game?.currentQuestion) {
      setTimeLeft(10);
      setSelectedAnswer(null);
    }
  }, [game?.currentQuestion, isGameEnded]);

  useEffect(() => {
    if (!isGameEnded && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!isGameEnded && timeLeft === 0) {
      onAnswer(false);
    }
  }, [timeLeft, isGameEnded, onAnswer]);

  const handleAnswerClick = (index) => {
    if (selectedAnswer !== null || !game?.currentQuestion) return;
    setSelectedAnswer(index);
    onAnswer(index === game.currentQuestion.correctAnswer);
  };

  if (isGameEnded) {
    return (
      <Container maxWidth="md">
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
          <Typography variant="h4" component="h2" gutterBottom>
            Game Over!
          </Typography>
          <Typography variant="h5" color="primary">
            Winner: {game?.winner?.name || 'No winner'}
          </Typography>
          <Box sx={{ width: '100%', mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Final Scores:
            </Typography>
            {game?.finalScores?.map((p) => (
              <Typography key={p.id} variant="body1">
                {p.name}: {p.score} points
              </Typography>
            ))}
          </Box>
        </Paper>
      </Container>
    );
  }

  if (!game || !game.currentQuestion) {
    return (
      <Container maxWidth="md">
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
          <Typography variant="h5" component="h2">
            Loading game...
          </Typography>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Box sx={{ width: '100%' }}>
          <LinearProgress
            variant="determinate"
            value={(timeLeft / 10) * 100}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="body2" color="text.secondary" align="right" sx={{ mt: 1 }}>
            Time left: {timeLeft}s
          </Typography>
        </Box>

        <Typography variant="h6" color="text.secondary">
          Question {game.questionNumber} of {game.totalQuestions}
        </Typography>

        <Typography variant="h5" component="h2">
          {game.currentQuestion.text}
        </Typography>

        <Grid container spacing={2}>
          {game.currentQuestion.options.map((option, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Button
                fullWidth
                variant={selectedAnswer === index ? 'contained' : 'outlined'}
                onClick={() => handleAnswerClick(index)}
                disabled={selectedAnswer !== null}
                sx={{ height: 60 }}
              >
                {option}
              </Button>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          {game.players.map((p) => (
            <Typography key={p.id} variant="h6">
              {p.name}: {p.score}
            </Typography>
          ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default Game; 