const authMiddleware = require('./middleware');
const { loginPlayer } = require('./services');

async function routes(fastify, options) {
  fastify.post('/login',async (request, reply) => {
    try {
      const { email, password } = request.body;
 
      const result = await loginPlayer(email, password);
      return reply.code(200).send(result);
    } catch (error) {
      console.log({error});
      const statusCode = error.statusCode || 500;
      return reply.code(statusCode).send({ error: error.message });
    }
  });
}

module.exports = routes;
