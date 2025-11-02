const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const GameCode = require('../models/GameCode'); // según tu estructura
const { protect } = require('../middleware/authMiddleware');


// Obtener órdenes de un usuario
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
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id; // ✅ ID del usuario autenticado
    const { products, customer, shipping, payment, totals } = req.body;

    // 1️⃣ Verificar productos y stock
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Producto ${item.productId} no encontrado` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Stock insuficiente para ${product.name}` });
      }
    }

    // 2️⃣ Crear la orden asociada al usuario
    const order = new Order({
      user: userId,
      products,
      customer,
      shipping,
      payment,
      totals
    });
    await order.save();

    // 3️⃣ Asignar códigos a cada producto
    const assignedCodes = [];
    for (const item of products) {
      for (let i = 0; i < item.quantity; i++) {
        const code = await GameCode.findOneAndUpdate(
          { product: item.productId, status: 'valid' },
          { status: 'used', assignedTo: userId },
          { new: true }
        );
        if (code) {
          assignedCodes.push({ product: item.productId, code: code.code });
        }
      }

      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // 4️⃣ Responder con la orden y los códigos
    res.status(201).json({
      message: 'Orden creada exitosamente',
      order,
      codes: assignedCodes
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