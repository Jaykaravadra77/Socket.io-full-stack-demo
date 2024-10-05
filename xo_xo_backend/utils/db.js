const mongoose = require('mongoose');

// MongoDB connection URL
const mongoURL = 'mongodb://localhost:27017/xoxo_game';

// Create the mongoose connection
const connectDB = async () => {
  try {
    await mongoose.connect(mongoURL);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Export the connection function
module.exports = connectDB;
