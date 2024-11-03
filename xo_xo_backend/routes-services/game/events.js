const Player = require('../../models/player');
const Game = require('../../models/xo_xo_game');
const { makeMove, updateGameStatus } = require('./services');
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

    socket.on('readyToStart', async (data) => {
      const { gameId } = data;
      const game = await Game.findById(gameId);

      console.log('readyToStart', {game});
      
      
      if (game && game.status === 'waiting' && game.players.length === 2) {
        // Update game status to 'ready'
        await updateGameStatus(gameId, 'ready');
        
        const countdownDuration = 30; // 30 seconds countdown
        
        // Emit countdown start event
        io.to(game.room.toString()).emit('countdownStart', { duration: countdownDuration });
        
        // Start the countdown
        let timeLeft = countdownDuration;
        const countdownInterval = setInterval(async () => {
          timeLeft--;
          io.to(game.room.toString()).emit('countdownUpdate', { timeLeft });
          
          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            await updateGameStatus(gameId, 'in_progress');
            const updatedGame = await Game.findById(gameId).populate('players');
            
            // Prepare player data
            const playerData = updatedGame.players.map((player, index) => ({
              id: player._id.toString(),
              name: player.name,
              symbol: ['X', 'O'][index]
            }));
    
            io.to(updatedGame.room.toString()).emit('gameStart', {
              roomId: updatedGame.room.toString(),
              gameId: updatedGame._id.toString(),
              status: updatedGame.status,
              playersJoined: updatedGame.players.length,
              maxPlayers: 2,
              players: playerData,
              board: updatedGame.board,
              currentTurn: updatedGame.currentTurn.toString()
            });
          }
        }, 1000);
      }
    });

    socket.on('reconnectToGame', async (data) => {
      const { gameId, roomId, playerId, status } = data;
      try {
        const game = await Game.findById(gameId).populate('players');
        
        if (!game) {
          socket.emit('reconnectionFailed');
          return;
        }
    
        const playerIds = game.players.map(p => p._id.toString());
        if (!playerIds.includes(playerId)) {
          socket.emit('reconnectionFailed');
          return;
        }
    
        // Rejoin the socket room
        socket.join(roomId);
    
        // Prepare player data
        const playerInfo = await Player.find({ _id: { $in: game.players } }, 'name');
        const playerData = game.players.map((player, index) => ({
          id: player._id.toString(),
          name: playerInfo.find(p => p._id.toString() === player._id.toString())?.name,
          symbol: ['X', 'O'][index]
        }));
    
        // Send complete game state
        const gameState = {
          roomId: roomId,
          gameId: game._id.toString(),
          status: game.status,
          playersJoined: game.players.length,
          maxPlayers: 2,
          players: playerData,
          board: game.board,
          currentTurn: game.currentTurn.toString(),
          winner: game.winner,
          isDraw: game.winner === 'draw'
        };
    
        socket.emit('reconnectionSuccess', gameState);
    
        // If game is in countdown, sync the countdown
        if (game.status === 'ready') {
          // You might want to store countdown info in the game document
          // socket.emit('countdownStart', { duration: game.countdownDuration }); // or remaining duration
        }
      } catch (error) {
        console.error('Reconnection error:', error);
        socket.emit('reconnectionFailed');
      }
    });
  
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
            winner: updatedGame.winner === 'draw' ? 'draw' : updatedGame.winner.toString(),
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