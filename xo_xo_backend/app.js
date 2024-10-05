const fastify = require('fastify')({ logger: true });
const fastifyIO = require('fastify-socket.io');
const gameEvents = require('./routes-services/game/events');
const authRoutes = require('./routes-services/auth/route');
const gameRoutes = require('./routes-services/game/routes');
require('./utils/db')()

// Register the socket.io plugin
fastify.register(fastifyIO);
fastify.register(require('@fastify/formbody'))
 require('dotenv').config()

 // Register CORS plugin
fastify.register(require('@fastify/cors'), {
  origin: process.env.FRONTEND_URL , // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
})
 

// routes
fastify.register(authRoutes, { prefix: '/api/auth' });




fastify.register(gameRoutes, { prefix: '/api/game' });


  
// Start the server
const app = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log(`Server is running on http://localhost:3000`);

 
    // Initialize game events
    gameEvents.init(fastify.io);

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};


module.exports = {
    app
};
