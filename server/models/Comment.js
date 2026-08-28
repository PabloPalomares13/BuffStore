const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  text: {
    type: String,
    required: true,
    maxlength: 500
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date
}, { 
  timestamps: true 
});

// Índice compuesto para mejorar queries
commentSchema.index({ product: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });

// Método para calcular rating promedio de un producto
commentSchema.statics.getProductRating = async function(productId) {
  const result = await this.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId) } },
    { 
      $group: { 
        _id: null, 
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      } 
    }
  ]);
  
  return result.length > 0 ? result[0] : { avgRating: 0, totalReviews: 0 };
};

module.exports = mongoose.model('Comment', commentSchema);