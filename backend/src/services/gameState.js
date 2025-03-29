const { v4: uuidv4 } = require('uuid');
const { redisClient, isRedisConnected } = require('../config/redis');

// In-memory storage for fallback
let inMemoryQueue = [];
const waitingPlayers = new Map();
const activeGames = new Map();

const gameState = {
  // Queue management
  async addToQueue(player) {
    try {
      if (isRedisConnected) {
        await redisClient.lPush('waiting_queue', JSON.stringify(player));
      } else {
        inMemoryQueue.push(player);
      }
      return true;
    } catch (error) {
      console.error('Error adding to queue:', error);
      return false;
    }
  },

  async getQueue() {
    try {
      if (isRedisConnected) {
        return await redisClient.lRange('waiting_queue', 0, -1);
      }
      return inMemoryQueue.map(p => JSON.stringify(p));
    } catch (error) {
      console.error('Error getting queue:', error);
      return [];
    }
  },

  async removeFromQueue(count = 2) {
    try {
      if (isRedisConnected) {
        for (let i = 0; i < count; i++) {
          await redisClient.lPop('waiting_queue');
        }
      } else {
        inMemoryQueue = inMemoryQueue.slice(count);
      }
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  },

  // Game management
  createGame(player1, player2) {
    const roomId = uuidv4();
    const game = {
      roomId,
      players: [
        { id: player1.id, name: player1.name, score: 0 },
        { id: player2.id, name: player2.name, score: 0 }
      ],
      currentQuestion: 0,
      totalQuestions: 10
    };

    activeGames.set(roomId, game);
    return game;
  },

  getGame(roomId) {
    return activeGames.get(roomId);
  },

  updateGame(roomId, updates) {
    const game = activeGames.get(roomId);
    if (game) {
      Object.assign(game, updates);
      activeGames.set(roomId, game);
      return true;
    }
    return false;
  },

  deleteGame(roomId) {
    return activeGames.delete(roomId);
  },

  // Player management
  addWaitingPlayer(socketId, player) {
    waitingPlayers.set(socketId, player);
  },

  removeWaitingPlayer(socketId) {
    waitingPlayers.delete(socketId);
  },

  getWaitingPlayer(socketId) {
    return waitingPlayers.get(socketId);
  }
};

module.exports = gameState; 