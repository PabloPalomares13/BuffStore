// server/models/schemas/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Referencia a la orden
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // Usuario que realiza el pago
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Información de Mercado Pago
  mercadoPagoId: {
  type: String,
  unique: true,
  sparse: true
},

  preferenceId: {
    type: String,
    required: true
  },

  // Detalles del pago
  amount: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: 'COP', // Cambiar según tu país
    enum: ['COP', 'USD', 'ARS', 'MXN', 'BRL', 'CLP']
  },

  // Estado del pago
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process'],
    default: 'pending'
  },

  statusDetail: {
    type: String,
    default: ''
  },

  // Método de pago
  paymentMethod: {
    type: {
      type: String, // credit_card, debit_card, ticket, etc.
    },
    id: String, // visa, master, pse, etc.
    last_four_digits: String,
    cardholder_name: String
  },

  // Información adicional
  description: {
    type: String,
    required: true
  },

  // Metadata para tracking
  metadata: {
    items: [{
      productId: String,
      productName: String,
      quantity: Number,
      unitPrice: Number
    }],
    customerEmail: String,
    customerName: String
  },

  // Respuesta completa de Mercado Pago (para debugging)
  rawResponse: {
    type: mongoose.Schema.Types.Mixed,
    select: false // No se devuelve por defecto en queries
  },

  // Fechas importantes
  approvedAt: Date,
  refundedAt: Date,

}, {
  timestamps: true // createdAt, updatedAt
});


// Índices para búsquedas rápidas
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });


// Método para verificar si el pago está aprobado
paymentSchema.methods.isApproved = function() {
  return this.status === 'approved';
};

// Método para verificar si el pago está pendiente
paymentSchema.methods.isPending = function() {
  return this.status === 'pending' || this.status === 'in_process';
};

module.exports = mongoose.model('Payment', paymentSchema);