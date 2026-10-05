const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, isAdmin } = require('../middleware/authMiddleware');
 const Payment = require('../models/schemas/Payment');
 
// Obtener órdenes de un usuario
router.get('/my-orders', protect , isAdmin, async (req, res) => {
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
    const { products, customer, totals } = req.body;
 
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
 
       // 2️⃣ Reutilizar la última orden sin pagar en vez de crear una nueva en cada intento
    const orderData = {
      products,
      customer: { ...customer, email: req.user.email },
      totals
    };

    const candidate = await Order.findOne({
      user: userId,
      paymentStatus: { $in: ['pending', 'failed'] },
      orderStatus: 'created'
    }).sort({ createdAt: -1 });

    let reusable = null;
    if (candidate) {
      // No reutilizar si hay un pago real en curso o aprobado (ej: PSE pendiente)
      const inFlight = await Payment.exists({
        orderId: candidate._id,
        mercadoPagoId: { $ne: null },
        status: { $in: ['pending', 'in_process', 'authorized', 'in_mediation', 'approved'] }
      });
      if (!inFlight) reusable = candidate;
    }

    let order;
    if (reusable) {
      reusable.set(orderData);      // actualiza productos, datos y totales con el carrito actual
      order = await reusable.save();
    } else {
      order = await new Order({ user: userId, ...orderData }).save();
    }
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
router.get('/',protect, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 
// Obtener una orden por ID
router.get('/:id',protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para ver esta orden' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 
router.delete('/:id',protect, isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }
      if (order.paymentStatus === 'paid') {
        return res.status(400).json({ error: 'No se puede eliminar una orden pagada' });
      }
      await order.deleteOne();
      res.json({ message: 'Orden eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 
// Actualizar estado de una orden
router.patch('/:id/status',protect, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (status === 'paid') {
      return res.status(400).json({ error: 'El estado "paid" solo lo define el pago confirmado' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
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