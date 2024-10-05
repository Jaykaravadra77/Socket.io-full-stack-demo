const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  },
  status: {
    type: String,
    enum: ['waiting', 'full', 'in_game'],
    default: 'waiting'
  },
  maxPlayers: {
    type: Number,
    default: 2
  }
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
