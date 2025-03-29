const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { ExpressPeerServer } = require('peer');

const app = express();
const server = http.createServer(app);

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:3000', // Explicit origin (no wildcard)
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true, // Required for withCredentials
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Socket.IO Configuration
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Must match frontend URL
    methods: ['GET', 'POST'],
    credentials: true, // Must match withCredentials: true on client
  },
  transports: ['websocket', 'polling'], // WebSocket first
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Force CORS headers for Socket.IO engine
io.engine.on("initial_headers", (headers, req) => {
  headers["Access-Control-Allow-Origin"] = "http://localhost:3000";
  headers["Access-Control-Allow-Credentials"] = "true";
});

io.engine.on("headers", (headers, req) => {
  headers["Access-Control-Allow-Origin"] = "http://localhost:3000";
  headers["Access-Control-Allow-Credentials"] = "true";
});

// PeerJS Server
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs',
});

app.use('/peerjs', peerServer);

module.exports = { app, server, io };