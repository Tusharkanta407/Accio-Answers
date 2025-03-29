require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { app, server, io } = require('./config/server');
const setupSocketHandlers = require('./socket/eventHandlers');
const gameState = require('./services/gameState');

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

app.use(cors(corsOptions));

// For preflight requests
app.options('*', cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api/queue-status', async (req, res) => {
  try {
    const queue = await gameState.getQueue();
    res.json({ queueLength: queue.length });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

// Socket.IO CORS configuration
io.engine.on("initial_headers", (headers, req) => {
  headers["Access-Control-Allow-Origin"] = "http://localhost:3000";
  headers["Access-Control-Allow-Credentials"] = "true";
});

io.engine.on("headers", (headers, req) => {
  headers["Access-Control-Allow-Origin"] = "http://localhost:3000";
  headers["Access-Control-Allow-Credentials"] = "true";
});

// Set up socket handlers
setupSocketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});