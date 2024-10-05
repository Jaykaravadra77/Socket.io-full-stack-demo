const authMiddleware = require('../auth/middleware');
const { startGame } = require('./services');

const PlayerSocketMap = require('../../models/player_socke_mapping');

async function routes(fastify, options) {
  fastify.post('/start-game', { preHandler: authMiddleware }, async (request, reply) => {
    try {
      const playerId = request.user.id;

      // Fetch the socket ID for the player
      const playerSocketMapping = await PlayerSocketMap.findOne({ playerId,eStatus:'a' });
      if (!playerSocketMapping) {
        return reply.code(400).send({ error: 'Player not connected to a socket' });
      }
      const socketId = playerSocketMapping.socketId;

      const result = await startGame(playerId);

      if (fastify.io) {
        const socket = fastify.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.join(result.roomId);
        } else {
          console.warn(`Socket with ID ${socketId} not found`);
        }
      }
      
      // Send events to other players
      if (result.events && result.events.length > 0) {
        result.events.forEach(event => {
          fastify.io.to(result.roomId).emit(event.type, event.data);
        });
      }
      
      return reply.code(200).send(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return reply.code(statusCode).send({ error: error.message });
    }
  });
}

 
module.exports = routes;