const jwt = require('jsonwebtoken');
const Player = require('../../models/player');

 
const authMiddleware = async (request, reply) => {
  try {
    console.log(process.env.JWT_SECRET);
    const token = request.headers.authorization ;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const player = await Player.findById(decoded.id);
    
    if (!player) {
      throw new Error('Player not found');
    }
    
    request.user = player;
  } catch (error) {
    console.log({error});
    reply.code(401).send({ error: 'Authentication failed' });
  }
};

module.exports = authMiddleware;
