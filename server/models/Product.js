
// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  code: String,
  description: String,
  price: Number,
  stock: Number,
  taxRate: Number,
  category: String,
  tags: String,
  brand: String,
  vendor: String,
  images: [String] // Array de URLs de Google Cloud Storage
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);