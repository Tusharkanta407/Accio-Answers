const gameState = require('../services/gameState');

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    console.log('Transport:', socket.conn.transport.name);

    // Handle joining the queue
    socket.on('joinQueue', async (playerData) => {
      try {
        const player = {
          id: socket.id,
          name: playerData.name,
          socket: socket
        };

        await gameState.addToQueue(player);
        gameState.addWaitingPlayer(socket.id, player);

        // Check for matches
        checkForMatch(io);
      } catch (error) {
        console.error('Error joining queue:', error);
        socket.emit('error', { message: 'Failed to join queue' });
      }
    });

    // WebRTC Signaling
    socket.on('offer', (data) => {
      if (data.roomId && data.offer) {
        socket.to(data.roomId).emit('offer', {
          offer: data.offer,
          from: socket.id
        });
      }
    });

    socket.on('answer', (data) => {
      if (data.roomId && data.answer) {
        socket.to(data.roomId).emit('answer', {
          answer: data.answer,
          from: socket.id
        });
      }
    });

    socket.on('ice-candidate', (data) => {
      if (data.roomId && data.candidate) {
        socket.to(data.roomId).emit('ice-candidate', {
          candidate: data.candidate,
          from: socket.id
        });
      }
    });

    socket.on('peer-ready', (data) => {
      if (data.roomId) {
        socket.to(data.roomId).emit('peer-ready', {
          peerId: data.peerId
        });
      }
    });

    // Handle game answers
    socket.on('gameAnswer', (data) => {
      const { roomId, answer } = data;
      const game = gameState.getGame(roomId);
      
      if (game) {
        // Update game state with answer
        // This is where you'd implement your scoring logic
        socket.to(roomId).emit('scoreUpdate', {
          playerId: socket.id,
          score: 1 // Example score
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove from waiting players
      gameState.removeWaitingPlayer(socket.id);
      
      // Check if player was in an active game
      for (const [roomId, game] of gameState.activeGames.entries()) {
        if (game.players.some(p => p.id === socket.id)) {
          // Notify other player
          socket.to(roomId).emit('playerDisconnected');
          gameState.deleteGame(roomId);
          break;
        }
      }
    });
  });
};

// Helper function to check for matches
const checkForMatch = async (io) => {
  try {
    const queue = await gameState.getQueue();
    if (queue.length >= 2) {
      const player1 = JSON.parse(queue[0]);
      const player2 = JSON.parse(queue[1]);

      // Create a new game
      const game = gameState.createGame(player1, player2);
      
      // Remove players from queue
      await gameState.removeFromQueue(2);

      // Join players to the game room
      player1.socket.join(game.roomId);
      player2.socket.join(game.roomId);

      // Notify players of match
      io.to(game.roomId).emit('matchFound', {
        roomId: game.roomId,
        players: game.players,
        status: 'playing'
      });
    }
  } catch (error) {
    console.error('Error checking for matches:', error);
  }
};

function sendQuestion(roomId, io) {
  const game = gameState.getGame(roomId);
  if (!game) return;

  const question = {
    id: game.currentQuestion,
    text: "What is the capital of France?",
    options: ["London", "Paris", "Berlin", "Madrid"],
    correctAnswer: 1
  };

  game.currentQuestion = question;
  gameState.updateGame(roomId, { currentQuestion: question });

  io.to(roomId).emit('question', {
    roomId,
    question,
    questionNumber: game.currentQuestion.id + 1,
    totalQuestions: game.totalQuestions
  });

  setTimeout(() => {
    game.currentQuestion.id++;
    if (game.currentQuestion.id < game.totalQuestions) {
      sendQuestion(roomId, io);
    } else {
      endGame(roomId, io);
    }
  }, 10000);
}

function endGame(roomId, io) {
  const game = gameState.getGame(roomId);
  if (!game) return;

  const winner = game.players.reduce((prev, current) => 
    (prev.score > current.score) ? prev : current
  );

  io.to(roomId).emit('gameEnd', {
    roomId,
    winner,
    finalScores: game.players
  });

  gameState.deleteGame(roomId);
}

module.exports = setupSocketHandlers; 