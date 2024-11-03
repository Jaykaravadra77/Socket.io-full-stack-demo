const jwt = require('jsonwebtoken');
const Player = require('../../models/player');



exports.loginPlayer = async (email, password) => {
  console.log({email,password});
  const player = await Player.findOne({ email });
  if (!player) {
    throw new Error('Player not found');
  }
  
  if (password !== player.password) {
    throw new Error('Invalid password');
  }

  console.log(process.env.JWT_SECRET);

  const token = jwt.sign({ id: player._id }, process.env.JWT_SECRET, { expiresIn: '5y' });

  player.aToken.sToken = token;
  await player.save();

  return { token , playerId: player._id};
};
