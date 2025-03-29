import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Container, CssBaseline, ThemeProvider, createTheme, Typography, CircularProgress } from '@mui/material';
import Lobby from './components/Lobby';
import VideoGame from './components/VideoGame';
import WaitingRoom from './components/WaitingRoom';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

const App = () => {
  const [gameState, setGameState] = useState(null);
  const [player, setPlayer] = useState(null);
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'http://172.168.169.221:3001';
    
    const socket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
      path: '/socket.io/',
      upgrade: true
    });

    socket.on('connect', () => {
      console.log('Connected to server');
      setSocket(socket);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
      setConnectionError(error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        socket.connect();
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('matchFound', (data) => {
      console.log('Match found:', data);
      setGameState(data);
      setPlayer(data.players.find(p => p.id === socket.id));
      setIsWaiting(false);
    });

    socket.on('question', (data) => {
      console.log('Received question:', data);
      setGameState(prev => ({
        ...prev,
        currentQuestion: data.question,
        questionNumber: data.questionNumber,
        totalQuestions: data.totalQuestions
      }));
    });

    socket.on('scoreUpdate', (data) => {
      console.log('Score update:', data);
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => 
          data.scores.find(s => s.id === p.id) || p
        )
      }));
    });

    socket.on('gameEnd', (data) => {
      console.log('Game ended:', data);
      setGameState(prev => ({
        ...prev,
        winner: data.winner,
        finalScores: data.finalScores
      }));
      setIsGameEnded(true);
    });

    socket.on('playerDisconnected', (data) => {
      console.log('Player disconnected:', data);
      setIsGameEnded(true);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const handleJoinGame = (name) => {
    if (socket && isConnected && socket.id) {
      setPlayerName(name);
      setPlayer({ id: socket.id, name });
      setIsWaiting(true);
      socket.emit('joinQueue', { name });
    } else {
      console.error('Cannot join game: Socket not connected or no ID available');
      setConnectionError('Connection not ready. Please try again.');
    }
  };

  const handleAnswer = (isCorrect) => {
    if (socket && gameState?.roomId) {
      socket.emit('gameAnswer', {
        roomId: gameState.roomId,
        isCorrect
      });
    }
  };

  const renderGameState = () => {
    if (!isConnected) {
      return (
        <Container>
          <Typography variant="h5" color="error" align="center">
            {connectionError || 'Connecting to server...'}
          </Typography>
          <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />
        </Container>
      );
    }

    if (isWaiting) {
      return <WaitingRoom player={socket?.id ? { id: socket.id, name: playerName } : null} />;
    }

    if (isGameEnded) {
      return (
        <VideoGame
          game={gameState}
          player={player}
          onAnswer={handleAnswer}
          socket={socket}
          roomId={gameState?.roomId}
          isGameEnded
        />
      );
    }

    if (gameState?.status === 'playing') {
      return (
        <VideoGame
          game={gameState}
          player={player}
          onAnswer={handleAnswer}
          socket={socket}
          roomId={gameState.roomId}
        />
      );
    }

    return <Lobby onJoinQueue={handleJoinGame} />;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {renderGameState()}
      </Container>
    </ThemeProvider>
  );
};

export default App; 