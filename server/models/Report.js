const mongoose = require('mongoose');
 
const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['queja', 'reclamo', 'sugerencia', 'falla_producto', 'falla_sitio'],
    required: true
  },
  message: { type: String, required: true },
  relatedProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  relatedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  chatSummary: { type: String, default: '' },
  status: {
    type: String,
    enum: ['open', 'in_review', 'closed'],
    default: 'open'
  }
}, { timestamps: true });
 
module.exports = mongoose.model('Report', reportSchema);