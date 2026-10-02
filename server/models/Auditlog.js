const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Quién hizo el cambio
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorEmail: { type: String, required: true },

  // A quién se le hizo
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetEmail: { type: String, required: true },

  action: {
    type: String,
    enum: ['role_change', 'block', 'unblock'],
    required: true,
  },

  // Valores antes y después (ej: 'user' -> 'admin')
  from: { type: String, default: '' },
  to: { type: String, default: '' },
}, { timestamps: { createdAt: true, updatedAt: false } });

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);