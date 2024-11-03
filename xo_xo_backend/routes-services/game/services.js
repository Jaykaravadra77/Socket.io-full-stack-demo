const Room = require('../../models/rooms');
const Player = require('../../models/player');
const Game = require('../../models/xo_xo_game');
const PlayerSocketMap = require('../../models/player_socke_mapping');

const controllers = {}

controllers.startGame = async (playerId) => {
  // Find an existing room with available slots
  let room = await Room.findOne({ status: 'waiting' });
  let game;
  let isNewPlayer = false;

  // Fetch the player's information
  const player = await Player.findById(playerId);
  if (!player) {
    throw new Error('Player not found');
  }

  if (!room) {
    // If no available room, create a new one
    room = new Room({
      name: `Room-${Date.now()}`,
      players: [playerId],
      status: 'waiting',
      maxPlayers: 2
    });
    isNewPlayer = true;
  } else {
    // Join the existing room
    if (!room.players.includes(playerId)) {
      room.players.push(playerId);
      isNewPlayer = true;
    }
  }

  // Create or get the game
  if (!room.game) {
    game = new Game({
      players: room.players,
      currentTurn: room.players[0],
      status: 'waiting',
      room: room._id,
      board: [['', '', ''], ['', '', ''], ['', '', '']] // Initialize empty board
    });
    await game.save();
    room.game = game._id;
  } else {
    game = await Game.findById(room.game);
    // Update game players if a new player joined
    if (isNewPlayer) {
      game.players = room.players;
      game.currentTurn = game.players[0]; // Reset current turn to first player
    }
  }

  // Update room and game status
  if (room.players.length === room.maxPlayers) {
    room.status = 'full';
  }

  await room.save();
  await game.save();

  // Fetch all player information
  const playerInfo = await Player.find({ _id: { $in: room.players } }, 'name');
  const playerMap = playerInfo.reduce((map, player) => {
    map[player._id.toString()] = player.name;
    return map;
  }, {});

  // Prepare the response object with player data
  const response = {
    roomId: room._id.toString(),
    gameId: game._id.toString(),
    status: game.status,
    playersJoined: room.players.length,
    maxPlayers: room.maxPlayers,
    players: game.players.map((id, index) => ({
      id: id.toString(),
      name: playerMap[id.toString()],
      symbol: ['X', 'O'][index] // Assign symbols
    })),
    board: game.board
  };

  // Determine events to emit
  const events = [];
  if (isNewPlayer && room.players.length > 1) {
    events.push({
      type: 'player_joined',
      data: { 
        playerId, 
        playerName: player.name,
        playersJoined: room.players.length 
      }
    });
    events.push({
      type: 'ready_to_start',
      data: { gameId: game._id.toString() }
    });
  }

 

  // Add events to the response
  response.events = events;

  return response;
};

controllers.makeMove = async (gameId, playerId, move) => {
  const game = await Game.findById(gameId);
  
  if (!game) {
    throw new Error('Game not found');
  }

  if (game.status !== 'in_progress') {
    throw new Error('Game is not in progress');
  }


  if (game.currentTurn.toString() !== playerId) {
    throw new Error('Not your turn');
  }

  if (game.board[move.row][move.col] !== '') {
    throw new Error('Invalid move: cell already occupied');
  }

  const playerIndex = game.players.findIndex(p => p.toString() === playerId);
  const playerSymbol = ['X', 'O'][playerIndex];
  game.board[move.row][move.col] = playerSymbol;

  game.moves.push({
    player: playerId,
    position: move,
    symbol: playerSymbol
  });

  const winner = controllers.checkWinCondition(game.board);
  if (winner) {
    game.status = 'completed';
    game.winner = playerId;
  } else if (game.moves.length === 9) {
    game.status = 'completed';
    game.winner = 'draw';
  } else {
    // Find the next player's turn
    const nextPlayerIndex = (playerIndex + 1) % game.players.length;
    game.currentTurn = game.players[nextPlayerIndex];
  }

  await game.save();
  return game;
};

controllers.checkWinCondition = (board) => {
  // Check rows and columns
  for (let i = 0; i < 3; i++) {
    if (board[i][0] !== '' && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
      return board[i][0];
    }
    if (board[0][i] !== '' && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
      return board[0][i];
    }
  }
  
  // Check diagonals
  if (board[0][0] !== '' && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0];
  }
  if (board[0][2] !== '' && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2];
  }
  
  return null;
};


controllers.createPlayerSocketMapping = () => {
  const addMapping = async (playerId, socketId) => {
    try {
      await PlayerSocketMap.findOneAndUpdate(
        { playerId },
        { socketId },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error adding player-socket mapping:', error);
    }
  };

  const removeMapping = async (playerId) => {
    try {
      await PlayerSocketMap.findOneAndDelete({ playerId });
    } catch (error) {
      console.error('Error removing player-socket mapping:', error);
    }
  };

  const getSocketId = async (playerId) => {
    try {
      const mapping = await PlayerSocketMap.findOne({ playerId });
      return mapping ? mapping.socketId : null;
    } catch (error) {
      console.error('Error getting socket ID:', error);
      return null;
    }
  };

  const getPlayerId = async (socketId) => {
    try {
      const mapping = await PlayerSocketMap.findOne({ socketId });
      return mapping ? mapping.playerId : null;
    } catch (error) {
      console.error('Error getting player ID:', error);
      return null;
    }
  };

  return {
    addMapping,
    removeMapping,
    getSocketId,
    getPlayerId
  };
};

controllers.updateGameStatus = async (gameId, status) => {
  try {
    const game = await Game.findByIdAndUpdate(
      gameId,
      { status: status },
      { new: true }
    );
    if (!game) {
      throw new Error('Game not found');
    }
    return game;
  } catch (error) {
    console.error('Error updating game status:', error);
    throw error;
  }
};



module.exports = controllers;