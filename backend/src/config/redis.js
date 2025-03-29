const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

let isRedisConnected = false;

redisClient.on('error', (err) => {
  console.log('Redis Client Error:', err);
  isRedisConnected = false;
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
  isRedisConnected = true;
});

// Connect to Redis
redisClient.connect().catch(err => {
  console.log('Failed to connect to Redis, using in-memory storage');
  isRedisConnected = false;
});

module.exports = { redisClient, isRedisConnected }; 