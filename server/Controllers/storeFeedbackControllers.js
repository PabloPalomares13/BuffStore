const mongoose = require('mongoose');
const StoreFeedback = require('../models/StoreFeedback');
const Order = require('../models/Order');
const GameCode = require('../models/GameCode');

const RATING_KEYS = ['purchaseEase', 'deliverySpeed', 'paymentTrust'];
const COMMENT_MAX = 500;
const MAX_LIMIT = 50;

// Mismo criterio de "compra válida" que usa la etiqueta de propietario
const VALID_ORDER = {
  paymentStatus: 'paid',
  orderStatus: { $nin: ['cancelled', 'refunded'] }
};

/**
 * Orden pagada más reciente del usuario que incluye el juego.
 * Si no aparece en las órdenes, se intenta por el GameCode asignado.
 */
const findPurchaseOrder = async (userId, productId) => {
  const order = await Order.findOne({
    user: userId,
    'products.productId': productId,
    ...VALID_ORDER
  })
    .sort({ createdAt: -1 })
    .select('_id createdAt')
    .lean();

  if (order) return order;

  const code = await GameCode.findOne({
    product: productId,
    assignedTo: userId,
    order: { $ne: null }
  })
    .select('order')
    .lean();

  if (!code) return null;

  return Order.findOne({ _id: code.order, user: userId, ...VALID_ORDER })
    .select('_id createdAt')
    .lean();
};

const serialize = (fb) => ({
  _id: fb._id,
  order: fb.order,
  ratings: {
    purchaseEase: fb.ratings.purchaseEase,
    deliverySpeed: fb.ratings.deliverySpeed,
    paymentTrust: fb.ratings.paymentTrust
  },
  comment: fb.comment || '',
  isEdited: fb.isEdited,
  editedAt: fb.editedAt,
  createdAt: fb.createdAt
});

// Las 3 calificaciones son obligatorias al enviar; el comentario es opcional
const validatePayload = (body) => {
  const input = body.ratings || {};
  const ratings = {};

  for (const key of RATING_KEYS) {
    const value = Number(input[key]);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return { error: 'Debes responder las 3 preguntas con un número entero del 1 al 5' };
    }
    ratings[key] = value;
  }

  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  if (comment.length > COMMENT_MAX) {
    return { error: `La opinión no puede superar ${COMMENT_MAX} caracteres` };
  }

  return { ratings, comment };
};

/* ------------------------------------------------------------------ */
/* GET /api/store-feedback/product/:productId   (requiere login)       */
/* ¿Puede este usuario calificar la compra de este juego? ¿Ya lo hizo? */
/* ------------------------------------------------------------------ */
exports.getMyStoreFeedback = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'ID de producto inválido' });
    }

    const order = await findPurchaseOrder(req.user._id, productId);
    if (!order) return res.json({ eligible: false });

    const feedback = await StoreFeedback.findOne({ order: order._id }).lean();

    res.json({
      eligible: true,
      orderId: order._id,
      orderDate: order.createdAt,
      feedback: feedback ? serialize(feedback) : null
    });
  } catch (error) {
    console.error('Error consultando opinión de compra:', error);
    res.status(500).json({ message: 'Error al consultar tu opinión de compra' });
  }
};

/* ------------------------------------------------------------------ */
/* PUT /api/store-feedback/order/:orderId   (crea o edita)             */
/* ------------------------------------------------------------------ */
exports.saveStoreFeedback = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'ID de orden inválido' });
    }

    // La orden debe ser del usuario y estar pagada
    const order = await Order.findOne({ _id: orderId, user: req.user._id, ...VALID_ORDER })
      .select('_id')
      .lean();
    if (!order) {
      return res.status(403).json({ message: 'Solo puedes opinar sobre compras pagadas hechas con tu cuenta' });
    }

    const payload = validatePayload(req.body);
    if (payload.error) return res.status(400).json({ message: payload.error });

    const existing = await StoreFeedback.findOne({ order: order._id });

    if (existing) {
      existing.ratings = payload.ratings;
      existing.comment = payload.comment;
      existing.isEdited = true;
      existing.editedAt = new Date();
      await existing.save();
      return res.json({ feedback: serialize(existing.toObject()) });
    }

    try {
      const created = await StoreFeedback.create({
        user: req.user._id,
        order: order._id,
        ratings: payload.ratings,
        comment: payload.comment
      });
      return res.status(201).json({ feedback: serialize(created.toObject()) });
    } catch (err) {
      // Doble clic / dos pestañas a la vez
      if (err.code === 11000) {
        return res.status(409).json({ message: 'Ya enviaste tu opinión sobre esta compra. Recarga para editarla.' });
      }
      throw err;
    }
  } catch (error) {
    console.error('Error guardando opinión de compra:', error);
    res.status(500).json({ message: 'Error al guardar tu opinión' });
  }
};

/* ------------------------------------------------------------------ */
/* GET /api/store-feedback   (solo admin)                              */
/* ------------------------------------------------------------------ */
exports.listStoreFeedback = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), MAX_LIMIT);

    const [items, total, averages] = await Promise.all([
      StoreFeedback.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'fullName nickname email')
        .populate('order', 'createdAt totals')
        .lean(),
      StoreFeedback.countDocuments(),
      StoreFeedback.getAverages()
    ]);

    res.json({
      feedback: items,
      averages,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error listando opiniones de compra:', error);
    res.status(500).json({ message: 'Error al obtener las opiniones' });
  }
};