const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://shprodmongo:sgohUAADlkABqT6D@saleshive-prod-cluster.gf6uf.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

// Check connection
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Check for MongoDB connection error
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

module.exports = db;
