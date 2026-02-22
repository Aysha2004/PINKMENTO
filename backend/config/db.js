const dns = require('dns');
const mongoose = require('mongoose');

// Force Node.js to use Google DNS — fixes SRV lookup for mongodb+srv:// URIs
// on networks where the local router blocks DNS SRV record queries.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '../../debug.log');
const logToFile = (msg) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] DB: ${msg}\n`);
};

const connectDB = async () => {
  try {
    logToFile('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 2000,
    });
    logToFile('MongoDB Atlas connected successfully');
    console.log('MongoDB Atlas connected');
  } catch (err) {
    logToFile(`MongoDB connection error: ${err.message}`);
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
