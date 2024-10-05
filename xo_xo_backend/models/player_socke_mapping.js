const mongoose = require('mongoose');

const playerSocketMapSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true },
  socketId: { type: String, required: true, unique: true },
}, { timestamps: true });

const PlayerSocketMap = mongoose.model('PlayerSocketMap', playerSocketMapSchema);

module.exports = PlayerSocketMap;