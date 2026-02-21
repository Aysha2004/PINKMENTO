const dns = require('dns');
const mongoose = require('mongoose');

// Force Node.js to use Google DNS — fixes SRV lookup for mongodb+srv:// URIs
// on networks where the local router blocks DNS SRV record queries.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Atlas connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
