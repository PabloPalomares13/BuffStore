const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: Number,
    taxRate: Number
  }],
  customer: {
    fullName: String,
    email: String,
    phone: String
  },
  shipping: {
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  payment: {
    cardName: String,
    cardLast4: String
  },
  totals: {
    subtotal: Number,
    taxes: Number,
    total: Number
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'paid'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },

  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },

  paymentMethod: {
    type: String,
    enum: ['mercadopago', 'cash', 'transfer', 'other'],
    default: 'mercadopago'
  },

  // Para productos digitales (códigos de juego)
  digitalProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    gameCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GameCode'
    },
    delivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date
  }],

  // Estado de la orden
  orderStatus: {
    type: String,
    enum: ['created', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'created'
  },

  // Fechas importantes
  paidAt: Date,
  completedAt: Date,
  cancelledAt: Date,

  // Notas internas
  notes: {
    type: String,
    default: ''
  },

  // ============ FIN NUEVOS CAMPOS ============

}, {
  timestamps: true
});

// Índice para búsquedas por estado de pago
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ user: 1, createdAt: -1 });

// Método para marcar como pagada
orderSchema.methods.markAsPaid = function(paymentId) {
  this.paymentStatus = 'paid';
  this.paymentId = paymentId;
  this.paidAt = new Date();
  this.orderStatus = 'processing';
  return this.save();
};

// Método para completar orden (después de entregar productos digitales)
orderSchema.methods.complete = function() {
  this.orderStatus = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Método para verificar si todos los productos digitales fueron entregados
orderSchema.methods.areAllProductsDelivered = function() {
  if (!this.digitalProducts || this.digitalProducts.length === 0) {
    return true;
  }
  return this.digitalProducts.every(product => product.delivered);
};

module.exports = mongoose.model('Order', orderSchema);




