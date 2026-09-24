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
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'La calificación debe ser un número entero entre 1 y 5'
    }
  },
  text: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
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

// Índices para listar reseñas por producto / por usuario
commentSchema.index({ product: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });

// Un usuario solo puede dejar UNA reseña por juego
commentSchema.index({ product: 1, user: 1 }, { unique: true });

// Rating promedio y total de reseñas de un producto
commentSchema.statics.getProductRating = async function (productId) {
  const result = await this.aggregate([
    // `new` es obligatorio en Mongoose 7+ (sin `new` lanza error)
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (result.length === 0) return { avgRating: 0, totalReviews: 0 };

  return {
    avgRating: Math.round(result[0].avgRating * 10) / 10, // 1 decimal
    totalReviews: result[0].totalReviews
  };
};

module.exports = mongoose.model('Comment', commentSchema);