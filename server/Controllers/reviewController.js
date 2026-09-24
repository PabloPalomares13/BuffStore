const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Product = require('../models/Product');
const Order = require('../models/Order');
const GameCode = require('../models/GameCode');

const MAX_LIMIT = 50;
const TEXT_MIN = 5;
const TEXT_MAX = 500;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Nombre público del autor. Nunca se expone el email ni el nombre completo.
const getDisplayName = (user) => {
  if (!user) return 'Usuario';
  if (user.nickname) return user.nickname;
  if (user.fullName) return user.fullName.trim().split(/\s+/)[0];
  return 'Usuario';
};


const getOwnerIds = async (productId, userIds) => {
  if (!userIds.length) return new Set();

  const [fromOrders, fromCodes] = await Promise.all([
    Order.distinct('user', {
      user: { $in: userIds },
      'products.productId': productId,
      paymentStatus: 'paid',
      orderStatus: { $nin: ['cancelled', 'refunded'] }
    }),
    GameCode.distinct('assignedTo', {
      product: productId,
      assignedTo: { $in: userIds }
    })
  ]);

  return new Set([...fromOrders, ...fromCodes].map(String));
};

// Recalcula promedio/total y los guarda en el producto (útil para tarjetas del Home)
const syncProductStats = async (productId) => {
  const stats = await Comment.getProductRating(productId);
  try {
    await Product.findByIdAndUpdate(productId, {
      reviewsAvg: stats.avgRating,
      reviewsCount: stats.totalReviews
    });
  } catch (err) {
    // No debe romper la petición si falla la sincronización
    console.error('Error sincronizando stats del producto:', err.message);
  }
  return stats;
};

// Forma pública de una reseña (lo que ve el frontend)
const serializeReview = (review, ownerSet, viewer) => {
  const author = review.user;
  const authorId = author && author._id ? String(author._id) : null;

  return {
    _id: review._id,
    rating: review.rating,
    text: review.text,
    isEdited: review.isEdited,
    editedAt: review.editedAt,
    createdAt: review.createdAt,
    author: {
      name: getDisplayName(author),
      avatarUrl: (author && author.avatarUrl) || ''
    },
    isOwner: authorId ? ownerSet.has(authorId) : false,
    isMine: !!(viewer && authorId && authorId === String(viewer._id))
  };
};

const validatePayload = (body) => {
  const rating = Number(body.rating);
  const text = typeof body.text === 'string' ? body.text.trim() : '';

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'La calificación debe ser un número entero entre 1 y 5' };
  }
  if (text.length < TEXT_MIN) {
    return { error: `La reseña debe tener al menos ${TEXT_MIN} caracteres` };
  }
  if (text.length > TEXT_MAX) {
    return { error: `La reseña no puede superar ${TEXT_MAX} caracteres` };
  }
  return { rating, text };
};

const AUTHOR_FIELDS = 'nickname fullName avatarUrl';

/* ------------------------------------------------------------------ */
/* GET /api/reviews/product/:productId   (público, auth opcional)      */
/* ------------------------------------------------------------------ */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'ID de producto inválido' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), MAX_LIMIT);
    const filter = { product: productId };

    const [reviews, total, stats] = await Promise.all([
      Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', AUTHOR_FIELDS)
        .lean(),
      Comment.countDocuments(filter),
      Comment.getProductRating(productId)
    ]);

    // Reseña del usuario que consulta (se muestra fija arriba, aunque esté en otra página)
    let myReview = null;
    if (req.user) {
      myReview = await Comment.findOne({ product: productId, user: req.user._id })
        .populate('user', AUTHOR_FIELDS)
        .lean();
    }

    // Ids únicos a consultar: autores de la página + el visitante
    const idMap = new Map();
    reviews.forEach((r) => r.user && idMap.set(String(r.user._id), r.user._id));
    if (req.user) idMap.set(String(req.user._id), req.user._id);

    const ownerSet = await getOwnerIds(productId, [...idMap.values()]);

    res.json({
      reviews: reviews.map((r) => serializeReview(r, ownerSet, req.user)),
      myReview: myReview ? serializeReview(myReview, ownerSet, req.user) : null,
      viewerOwnsProduct: req.user ? ownerSet.has(String(req.user._id)) : false,
      stats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error obteniendo reseñas:', error);
    res.status(500).json({ message: 'Error al obtener las reseñas' });
  }
};

/* ------------------------------------------------------------------ */
/* POST /api/reviews/product/:productId   (requiere login)             */
/* ------------------------------------------------------------------ */
exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'ID de producto inválido' });
    }

    const payload = validatePayload(req.body);
    if (payload.error) return res.status(400).json({ message: payload.error });

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    let review;
    try {
      review = await Comment.create({
        user: req.user._id,
        product: productId,
        rating: payload.rating,
        text: payload.text
      });
    } catch (err) {
      // Violación del índice único {product, user}
      if (err.code === 11000) {
        return res.status(409).json({ message: 'Ya escribiste una reseña para este juego. Puedes editarla.' });
      }
      throw err;
    }

    const [stats, ownerSet] = await Promise.all([
      syncProductStats(productId),
      getOwnerIds(productId, [req.user._id])
    ]);

    const plain = { ...review.toObject(), user: req.user.toObject() };
    res.status(201).json({ review: serializeReview(plain, ownerSet, req.user), stats });
  } catch (error) {
    console.error('Error creando reseña:', error);
    res.status(500).json({ message: 'Error al crear la reseña' });
  }
};

/* ------------------------------------------------------------------ */
/* PUT /api/reviews/:reviewId   (solo el autor)                        */
/* ------------------------------------------------------------------ */
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({ message: 'ID de reseña inválido' });
    }

    const review = await Comment.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });

    if (String(review.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Solo puedes editar tus propias reseñas' });
    }

    const payload = validatePayload(req.body);
    if (payload.error) return res.status(400).json({ message: payload.error });

    review.rating = payload.rating;
    review.text = payload.text;
    review.isEdited = true;
    review.editedAt = new Date();
    await review.save();

    const [stats, ownerSet] = await Promise.all([
      syncProductStats(review.product),
      getOwnerIds(review.product, [req.user._id])
    ]);

    const plain = { ...review.toObject(), user: req.user.toObject() };
    res.json({ review: serializeReview(plain, ownerSet, req.user), stats });
  } catch (error) {
    console.error('Error editando reseña:', error);
    res.status(500).json({ message: 'Error al editar la reseña' });
  }
};

/* ------------------------------------------------------------------ */
/* DELETE /api/reviews/:reviewId   (autor o admin)                     */
/* ------------------------------------------------------------------ */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({ message: 'ID de reseña inválido' });
    }

    const review = await Comment.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });

    const isAuthor = String(review.user) === String(req.user._id);
    if (!isAuthor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta reseña' });
    }

    const productId = review.product;
    await review.deleteOne();
    const stats = await syncProductStats(productId);

    res.json({ message: 'Reseña eliminada', stats });
  } catch (error) {
    console.error('Error eliminando reseña:', error);
    res.status(500).json({ message: 'Error al eliminar la reseña' });
  }
};