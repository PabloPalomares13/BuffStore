const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorites');
const { protect } = require('../middleware/authMiddleware');

// Obtener favoritos del usuario logueado
router.get('/', protect, async (req, res) => {
  const favorites = await Favorite.find({ userId: req.user.id }).populate('productId');
  res.json(favorites.map(f => f.productId));
});

// Agregar un favorito
router.post('/', protect, async (req, res) => {
  const { productId } = req.body;
  try {
    await Favorite.create({ userId: req.user.id, productId });
    res.status(201).json({ message: 'Agregado' });
  } catch (err) {
    if (err.code === 11000) return res.status(200).json({ message: 'Ya existía' });
    res.status(500).json({ message: 'Error al guardar favorito' });
  }
});

// Quitar un favorito
router.delete('/:productId', protect, async (req, res) => {
  await Favorite.deleteOne({ userId: req.user.id, productId: req.params.productId });
  res.json({ message: 'Eliminado' });
});

// Merge masivo (para cuando el usuario inicia sesión con favoritos ya en localStorage)
router.post('/merge', protect, async (req, res) => {
  const { productIds } = req.body;
  const ops = productIds.map(productId => ({
    updateOne: {
      filter: { userId: req.user.id, productId },
      update: { userId: req.user.id, productId },
      upsert: true,
    },
  }));
  if (ops.length) await Favorite.bulkWrite(ops);
  const favorites = await Favorite.find({ userId: req.user.id }).populate('productId');
  res.json(favorites.map(f => f.productId));
});

module.exports = router;