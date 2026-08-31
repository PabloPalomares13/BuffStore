
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  code: String,
  description: String,
  price: Number,
  stock: Number,
  taxRate: Number,
  category: String,
  tags:  { type: [String], default: [] },
  brand: String,
  vendor: String,
  images: [String],// Array de URLs de Google Cloud Storage
  media: [{
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    thumbnail: String,
    order: { type: Number, default: 0 },
    fileName: String,
    uploadedAt: { type: Date, default: Date.now },
    processing: { type: Boolean, default: false }
  }],
  platforms: {
    type: [String],
    enum: ['ps5', 'pc', 'xbox'],
    default: [],
  },
  featured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);