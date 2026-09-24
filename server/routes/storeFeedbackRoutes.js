const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  getMyStoreFeedback,
  saveStoreFeedback,
  listStoreFeedback
} = require('../Controllers/storeFeedbackControllers');

// Panel de administración: listado + promedios por pregunta
router.get('/', protect, isAdmin, listStoreFeedback);

// Usuario: ¿puedo calificar la compra de este juego? ¿ya lo hice?
router.get('/product/:productId', protect, getMyStoreFeedback);

// Usuario: crear o editar la opinión de una orden suya
router.put('/order/:orderId', protect, saveStoreFeedback);

module.exports = router;