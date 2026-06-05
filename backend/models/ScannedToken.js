const mongoose = require('mongoose');

const ScannedTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: String,
  ticketId: String,
  scannedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ScannedToken', ScannedTokenSchema);
