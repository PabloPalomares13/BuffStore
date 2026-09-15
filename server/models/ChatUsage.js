const mongoose = require('mongoose');
 
// Un documento por (identifier, windowStart). "identifier" es "user:<id>"
// para usuarios registrados o "ip:<ip>" para invitados.
const chatUsageSchema = new mongoose.Schema({
  identifier: { type: String, required: true },
  windowStart: { type: Date, required: true },
  messageCount: { type: Number, default: 0 }
});
 
chatUsageSchema.index({ identifier: 1, windowStart: 1 }, { unique: true });
 
// TTL: Mongo borra automáticamente los documentos 1 hora después de
// windowStart, así la colección no crece indefinidamente.
chatUsageSchema.index({ windowStart: 1 }, { expireAfterSeconds: 3600 });
 
module.exports = mongoose.model('ChatUsage', chatUsageSchema);