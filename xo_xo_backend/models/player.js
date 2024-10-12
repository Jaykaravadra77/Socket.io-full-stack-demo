const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  aToken: {
    sToken: {
      type: String,
      default: null
    }
  }
}, { timestamps: true });

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
