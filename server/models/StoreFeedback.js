const mongoose = require('mongoose');

const ratingField = {
  type: Number,
  required: true,
  min: 1,
  max: 5,
  validate: {
    validator: Number.isInteger,
    message: 'La calificación debe ser un número entero entre 1 y 5'
  }
};

// Opinión del cliente sobre el PROCESO DE COMPRA / la tienda (no sobre el juego).
// Es una por orden: si compró varios juegos en la misma orden, califica la compra una sola vez.
const storeFeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  ratings: {
    purchaseEase: ratingField,  // ¿Qué tan fácil fue completar la compra?
    deliverySpeed: ratingField, // ¿Qué tan rápido recibió el juego / código?
    paymentTrust: ratingField   // ¿Qué tan seguro se sintió al pagar?
  },
  // Opinión libre (opcional)
  comment: {
    type: String,
    trim: true,
    default: '',
    maxlength: 500
  },
  isEdited: { type: Boolean, default: false },
  editedAt: Date
}, {
  timestamps: true
});

// Una orden tiene un único dueño, así que basta con que `order` sea único
storeFeedbackSchema.index({ order: 1 }, { unique: true });
storeFeedbackSchema.index({ user: 1, createdAt: -1 });
storeFeedbackSchema.index({ createdAt: -1 });

// Promedios por pregunta (para el panel de administración)
storeFeedbackSchema.statics.getAverages = async function () {
  const [r] = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        purchaseEase: { $avg: '$ratings.purchaseEase' },
        deliverySpeed: { $avg: '$ratings.deliverySpeed' },
        paymentTrust: { $avg: '$ratings.paymentTrust' }
      }
    }
  ]);

  if (!r) return { total: 0, purchaseEase: 0, deliverySpeed: 0, paymentTrust: 0 };

  const round = (n) => Math.round(n * 10) / 10;
  return {
    total: r.total,
    purchaseEase: round(r.purchaseEase),
    deliverySpeed: round(r.deliverySpeed),
    paymentTrust: round(r.paymentTrust)
  };
};

module.exports = mongoose.model('StoreFeedback', storeFeedbackSchema);