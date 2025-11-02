const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const GameCode = require('../models/GameCode');

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

module.exports = router;