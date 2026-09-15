const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
 
 
// Obtener órdenes de un usuario
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error get my-orders:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});
 
// Crear una nueva orden
// IMPORTANTE: aquí NO se asignan códigos de juego ni se descuenta stock.
// Eso solo debe pasar cuando el pago se confirma como aprobado, en
// paymentController.js -> deliverDigitalProducts (llamado desde el webhook
// de Mercado Pago). Si asignáramos códigos aquí, se "queman" códigos y
// stock aunque el usuario nunca termine de pagar.
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id; // ✅ ID del usuario autenticado
    const { products, customer, shipping, payment, totals } = req.body;
 
    // 1️⃣ Verificar productos y stock disponible (solo validar, no descontar)
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Producto ${item.productId} no encontrado` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Stock insuficiente para ${product.name}` });
      }
    }
 
    // 2️⃣ Crear la orden asociada al usuario (queda 'pending' hasta que
    // Mercado Pago confirme el pago vía webhook)
    const order = new Order({
      user: userId,
      products,
      customer,
      shipping,
      payment,
      totals
    });
    await order.save();
 
    // 3️⃣ Responder con la orden creada (sin códigos todavía —
    // esos llegan por correo cuando el pago se apruebe)
    res.status(201).json({
      message: 'Orden creada exitosamente',
      order
    });
  } catch (error) {
    console.error('Error al crear la orden:', error);
    res.status(500).json({ error: error.message });
  }
});
 
 
// Obtener todas las órdenes
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 
// Obtener una orden por ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.json({ message: 'Orden eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 
// Actualizar estado de una orden
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
 
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
 
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
 
 
module.exports = router;