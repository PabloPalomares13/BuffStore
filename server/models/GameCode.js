const mongoose = require('mongoose');

const gameCodeSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['valid', 'used', 'expired'], default: 'valid' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date } 
});

module.exports = mongoose.model('GameCode', gameCodeSchema);