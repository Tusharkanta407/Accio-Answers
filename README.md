# Real-time 1v1 Trivia Matchmaking System

A Node.js-based real-time matchmaking system for 1v1 trivia games using Express, Socket.io, and Redis.

## Features

- Real-time player matchmaking
- WebSocket-based communication
- Redis queue management
- Real-time score updates
- Room-based game sessions
- Automatic game progression

## Prerequisites

- Node.js (v14 or higher)
- Redis server
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the variables as needed

3. Start Redis server:
```bash
redis-server
```

4. Start the application:
```bash
npm start
```

For development:
```bash
npm run dev
```

## API Endpoints

### WebSocket Events

#### Client to Server
- `joinQueue`: Join the matchmaking queue
  ```javascript
  socket.emit('joinQueue', { name: 'Player Name' });
  ```

- `answer`: Submit an answer to a question
  ```javascript
  socket.emit('answer', {
    roomId: 'room-uuid',
    isCorrect: true
  });
  ```

#### Server to Client
- `matchFound`: Emitted when a match is found
- `question`: Emitted when a new question is available
- `scoreUpdate`: Emitted when scores are updated
- `gameEnd`: Emitted when the game ends

### REST API
- `GET /api/queue-status`: Get the current queue length

## Game Flow

1. Players join the queue using the `joinQueue` event
2. When two players are available, they are matched and a room is created
3. Players receive questions every 10 seconds
4. Players submit answers using the `answer` event
5. Scores are updated in real-time
6. After 10 questions, the game ends and a winner is determined

## Environment Variables

- `PORT`: Server port (default: 3000)
- `REDIS_URL`: Redis connection URL (default: redis://localhost:6379)
