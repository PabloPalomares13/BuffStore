
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
  images: [{
    data: Buffer,
    contentType: String
  }]
  // images: [String] // Array of image URLs or paths
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);