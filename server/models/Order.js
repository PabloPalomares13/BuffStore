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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);