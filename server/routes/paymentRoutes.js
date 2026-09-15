// server/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createPaymentPreference, 
  handleWebhook, 
  getPaymentStatus,
  getUserPayments,
  verifyAndProcessPayment
} = require('../Controllers/paymentController');
const {protect} = require('../middleware/authMiddleware');

/**
 * @route   POST /api/payments/create-preference
 * @desc    Crear preferencia de pago para una orden
 * @access  Private (requiere JWT)
 */
router.post('/create-preference',protect, createPaymentPreference); // protect, 

/**
 * @route   POST /api/payments/webhook
 * @desc    Webhook para recibir notificaciones de Mercado Pago (IPN)
 * @access  Public (pero validado por Mercado Pago)
 * @note    NO usar authMiddleware aquí, MP envía las notificaciones sin JWT
 */
router.post('/webhook', handleWebhook);

/**
 * @route   POST /api/payments/verify/:paymentId
 * @desc    Fallback: verifica y procesa un pago manualmente (para cuando
 *          el webhook de sandbox no llega, ej: merchant_order bloqueado).
 *          Lo llama el frontend desde /checkout/success.
 * @access  Private
 */
router.post('/verify/:paymentId', protect, verifyAndProcessPayment);

/**
 * @route   GET /api/payments/:paymentId
 * @desc    Consultar estado de un pago específico
 * @access  Private
 */
router.get('/:paymentId', protect, getPaymentStatus);

/**
 * @route   GET /api/payments/user/history
 * @desc    Obtener historial de pagos del usuario autenticado
 * @access  Private
 * @query   ?status=approved&limit=10&page=1
 */
router.get('/user/history', protect, getUserPayments);

module.exports = router;