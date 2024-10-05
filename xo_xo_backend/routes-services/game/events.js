const { makeMove } = require('./services');
const { createPlayerSocketMapping } = require('./services');
const jwt = require('jsonwebtoken');

const gameEvents = {


  init: function(io) {

    console.log('Socket.IO initialized');
    const playerSocketMapping = createPlayerSocketMapping();

    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      console.log({token});
      if (!token) {
        return next(new Error('Authentication error'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.playerId = decoded.id;
        next();
      } catch (error) {
        console.log({error});
        next(new Error('Authentication error'));
      }
    });

    io.on('connection', (socket) => {
      console.log('a user connected');

      playerSocketMapping.addMapping(socket.playerId, socket.id);
      console.log(`Player ${socket.playerId} registered with socket ${socket.id}`);

      this.registerMoveEvents(socket, io);

      socket.on('disconnect', async () => {
        await playerSocketMapping.removeMapping(socket.playerId);
        console.log(`Player ${socket.playerId} disconnected`);
      });
    });
  },


  registerMoveEvents: function(socket, io) {
    socket.on('playerMove', async (data) => {
      try {
        const { gameId, playerId, move } = data;
        const updatedGame = await makeMove(gameId, playerId, move);
        
        io.to(updatedGame.room.toString()).emit('gameStateUpdated', {
          board: updatedGame.board,
          currentTurn: updatedGame.currentTurn,
          status: updatedGame.status
        });

        if (updatedGame.status === 'completed') {
          io.to(updatedGame.room.toString()).emit('gameOver', {
            winner: updatedGame.winner,
            isDraw: updatedGame.winner === 'draw'
          });
        }
      } catch (error) {
        socket.emit('moveError', { message: error.message });
      }
    });
  }
};

module.exports = gameEvents;