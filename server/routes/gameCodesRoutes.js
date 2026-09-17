const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const GameCode = require('../models/GameCode');
const Order = require('../models/Order');

// Obtener los códigos de un usuario
router.get('/user', protect, async (req, res) => {
  try {
    const codes = await GameCode.find({ assignedTo: req.user._id }).populate('product', 'name');
    res.json(codes);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los códigos', error: err.message });
  }
});

// Verificar si un código es válido
router.get("/verify/:code", async (req, res) => {
  try {
    const code = await GameCode.findOne({ code: req.params.code });
    if (!code) return res.status(404).json({ valid: false, message: "Código inexistente" });

    if (code.status === "expired") return res.json({ valid: false, message: "Código expirado" });
    if (code.status === "used") return res.json({ valid: false, message: "Código ya usado" });

    res.json({ valid: true, message: "Código válido", product: code.product });
  } catch (error) {
    console.error("Error al verificar código:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Solicitar el código de un producto digital ya comprado en una orden
// NOTA: escrito asumiendo que GameCode tiene { product, code, status, assignedTo }
// con status en algo como 'available' | 'used' | 'expired' (según /verify de arriba).
// Ajusta los nombres de campo si tu GameCode.js real es distinto.
router.post('/request', protect, async (req, res) => {
  try {
    const { orderId, productId } = req.body;

    if (!orderId || !productId) {
      return res.status(400).json({ message: 'orderId y productId son requeridos' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    // Solo el dueño de la orden puede solicitar el código
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Esta orden no te pertenece' });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'La orden todavía no está pagada' });
    }

    const digitalEntry = order.digitalProducts.find(
      (dp) => dp.productId.toString() === productId
    );

    if (!digitalEntry) {
      return res.status(404).json({ message: 'Este producto no es digital en esta orden' });
    }

    // Si ya se entregó antes, devolvemos el mismo código en vez de asignar uno nuevo
    if (digitalEntry.delivered && digitalEntry.gameCodeId) {
      const existingCode = await GameCode.findById(digitalEntry.gameCodeId);
      return res.json({ code: existingCode?.code || null });
    }

    // Toma un código disponible de forma atómica para evitar que dos compras
    // se lleven el mismo código en solicitudes simultáneas
    const gameCode = await GameCode.findOneAndUpdate(
      { product: productId, status: 'available' },
      { status: 'used', assignedTo: req.user._id },
      { new: true }
    );

    if (!gameCode) {
      return res.status(409).json({ message: 'No hay códigos disponibles para este producto' });
    }

    digitalEntry.gameCodeId = gameCode._id;
    digitalEntry.delivered = true;
    digitalEntry.deliveredAt = new Date();

    if (order.areAllProductsDelivered()) {
      order.orderStatus = 'completed';
      order.completedAt = new Date();
    }

    await order.save();

    res.json({ code: gameCode.code });
  } catch (error) {
    console.error('Error al solicitar el código:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

module.exports = router;  