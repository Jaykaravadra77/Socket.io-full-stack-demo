const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({  
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  }],
  board: {
    type: [[String]],
    default: [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ]
  },
  currentTurn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  winner: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed'],
    default: 'waiting'
  },
  moves: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    position: {
      row: Number,
      col: Number
    },
    symbol: String
  }],
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }
}, { timestamps: true });

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
