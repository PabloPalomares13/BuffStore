const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorites');
const { protect } = require('../middleware/authMiddleware');

// Separa los favoritos válidos de los huérfanos (producto ya eliminado) y
// borra los huérfanos en segundo plano, sin bloquear ni frenar la respuesta.
const splitValidAndCleanOrphans = (favorites) => {
  const valid = [];
  const orphanIds = [];

  for (const f of favorites) {
    if (f.productId) valid.push(f.productId);
    else orphanIds.push(f._id);
  }

  if (orphanIds.length) {
    Favorite.deleteMany({ _id: { $in: orphanIds } }).catch((err) =>
      console.error('Error limpiando favoritos huérfanos:', err)
    );
  }

  return valid;
};

// Obtener favoritos del usuario logueado
router.get('/', protect, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id }).populate('productId');
    res.json(splitValidAndCleanOrphans(favorites));
  } catch (err) {
    console.error('Error obteniendo favoritos:', err);
    res.status(500).json({ message: 'Error al obtener favoritos' });
  }
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
  try {
    await Favorite.deleteOne({ userId: req.user.id, productId: req.params.productId });
    res.json({ message: 'Eliminado' });
  } catch (err) {
    console.error('Error eliminando favorito:', err);
    res.status(500).json({ message: 'Error al eliminar favorito' });
  }
});

// Merge masivo (para cuando el usuario inicia sesión con favoritos ya en localStorage)
router.post('/merge', protect, async (req, res) => {
  try {
    const { productIds } = req.body;
    const ops = (productIds || []).map((productId) => ({
      updateOne: {
        filter: { userId: req.user.id, productId },
        update: { userId: req.user.id, productId },
        upsert: true,
      },
    }));
    if (ops.length) await Favorite.bulkWrite(ops);

    const favorites = await Favorite.find({ userId: req.user.id }).populate('productId');
    res.json(splitValidAndCleanOrphans(favorites));
  } catch (err) {
    console.error('Error en merge de favoritos:', err);
    res.status(500).json({ message: 'Error al sincronizar favoritos' });
  }
});

module.exports = router;