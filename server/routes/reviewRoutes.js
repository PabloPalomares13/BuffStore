const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview
} = require('../Controllers/reviewController');

// Público (si llega token, identifica al usuario para marcar "isMine" y "viewerOwnsProduct")
router.get('/product/:productId', optionalAuth, getProductReviews);

// Requieren sesión iniciada
router.post('/product/:productId', protect, createReview);
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;