const mercadopago = require('mercadopago');
const { getNotificationUrls, getDefaultPreferenceConfig, CURRENCY_CONFIG } = require('../config/mercadopagoConfig');
const Payment = require('../models/schemas/Payment');
const Order = require('../models/Order');
const GameCode = require('../models/GameCode');
const User = require('../models/User');

/**
 * Crear preferencia de pago (inicia el proceso de checkout)
 */
const createPaymentPreference = async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log('🔎 Debug - req.user:', req.user);
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      console.error('❌ Usuario no autenticado:', req.user);
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    console.log('🛒 Creando preferencia para orden:', orderId);
    console.log('👤 Usuario ID:', userId);

    // 1. Buscar la orden
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // 2. Verificar que la orden pertenece al usuario
    // Verificar si order.user existe antes de acceder
    if (!order.user) {
      console.error('❌ Orden sin usuario asignado:', order._id);
      throw new Error('La orden no tiene usuario asignado');
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a esta orden'
      });
    }

    // 3. Verificar que la orden no esté ya pagada
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Esta orden ya fue pagada'
      });
    }

    // 4. Obtener información del usuario
    const user = await User.findById(userId);

    // 5. Preparar items para Mercado Pago (usando datos ya guardados en order.products)
    const items = order.products.map(item => ({
      title: item.name || 'Producto',
      quantity: item.quantity || 1,
      unit_price: Number((item.price || 0).toFixed(2)),
      currency_id: 'COP',
    }));

    // 6. Configurar preferencia de pago
    const urls = getNotificationUrls();
    console.log('🔗 URLs configuradas:', urls);

    const preferenceData = {
      items,
      payer: {
        name: user.name || user.username,
        email: user.email,
      },
      back_urls: { // Es back_urls (en plural)
        success: urls.success,
        failure: urls.failure,
        pending: urls.pending,
      },
      // auto_return: 'approved',
      notification_url: urls.notification,
      external_reference: orderId.toString(),
      statement_descriptor: 'Buff Store',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    console.log('📤 Enviando preferencia a Mercado Pago...');

    // 7. Crear preferencia en Mercado Pago
    const client = new mercadopago.MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN
    });

    const preference = new mercadopago.Preference(client);

    const response = await preference.create({ body: preferenceData });

    console.log('✅ Respuesta completa MP:', JSON.stringify(response, null, 2));

    if (!response) {
      throw new Error('La respuesta de Mercado Pago es undefined');
    }

    // Check if response has id directly (v2) or in body (v1/other)
    const preferenceId = response.id || (response.body && response.body.id);

    if (!preferenceId) {
      console.error('❌ No se encontró ID en la respuesta:', response);
      throw new Error('No se pudo obtener el ID de la preferencia');
    }

    console.log('✅ Preferencia creada ID:', preferenceId);

    // 8. Guardar el registro de pago en tu DB
    const payment = new Payment({
      orderId: order._id,
      userId: userId,
      preferenceId: preferenceId,
      amount: order.totals.total,
      currency: 'COP',
      status: 'pending',
      description: `Orden #${order._id.toString().slice(-8)} - ${items.length} producto(s)`,
      metadata: {
        items: order.products.map(item => ({
          productId: item.productId ? item.productId.toString() : 'unknown',
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        customerEmail: order.customer.email,
        customerName: order.customer.fullName,
      }
    });

    await payment.save();

    // 9. Actualizar orden con referencia al pago
    order.paymentId = payment._id;
    await order.save();

    // 10. Enviar respuesta con datos para el checkout
    res.json({
      success: true,
      data: {
        preferenceId: preferenceId,
        initPoint: response.init_point || (response.body && response.body.init_point),
        sandboxInitPoint: response.sandbox_init_point || (response.body && response.body.sandbox_init_point),
        paymentId: payment._id,
        orderId: order._id,
      }
    });

  } catch (error) {
    console.error('❌ Error al crear preferencia de pago:', error);
    // console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al crear preferencia de pago',
      error: error.message
    });
  }
};

/**
 * Webhook para recibir notificaciones de Mercado Pago (IPN)
 */
const handleWebhook = async (req, res) => {
  try {
    // Mercado Pago envía el tipo de notificación
    const { type, data } = req.body;

    console.log('📨 Webhook recibido:', { type, data });

    // Solo procesar notificaciones de pagos
    if (type !== 'payment') {
      return res.status(200).send('OK');
    }

    // Obtener el ID del pago desde Mercado Pago
    const paymentId = data.id;

    // Consultar información completa del pago en Mercado Pago
    const paymentInfo = await mercadopago.payment.findById(paymentId);
    const paymentData = paymentInfo.body;

    console.log('💳 Información del pago:', {
      id: paymentData.id,
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      external_reference: paymentData.external_reference,
    });

    // Buscar el pago en nuestra DB usando external_reference (orderId)
    const orderId = paymentData.external_reference;
    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      console.error('❌ Pago no encontrado en DB:', orderId);
      return res.status(404).send('Payment not found');
    }

    // Actualizar información del pago
    payment.mercadoPagoId = paymentData.id.toString();
    payment.status = paymentData.status;
    payment.statusDetail = paymentData.status_detail;

    // Guardar método de pago
    if (paymentData.payment_method_id) {
      payment.paymentMethod = {
        type: paymentData.payment_type_id,
        id: paymentData.payment_method_id,
        last_four_digits: paymentData.card?.last_four_digits,
        cardholder_name: paymentData.card?.cardholder?.name,
      };
    }

    // Guardar respuesta completa para debugging
    payment.rawResponse = paymentData;

    // Si el pago fue aprobado
    if (paymentData.status === 'approved') {
      payment.approvedAt = new Date();
      await payment.save();

      // Actualizar la orden
      const order = await Order.findById(orderId).populate('items.product');
      await order.markAsPaid(payment._id);

      // Entregar productos digitales (códigos de juego)
      await deliverDigitalProducts(order);

      console.log('✅ Pago aprobado y productos entregados');
    } else {
      await payment.save();
      console.log('⏳ Pago en estado:', paymentData.status);
    }

    // Responder OK a Mercado Pago
    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.status(500).send('Error');
  }
};

/**
 * Función auxiliar para entregar productos digitales
 */
const deliverDigitalProducts = async (order) => {
  try {
    const deliveredProducts = [];

    for (const item of order.items) {
      const product = item.product;

      // Solo procesar productos digitales
      if (product.type === 'game_code' || product.type === 'digital') {
        // Buscar códigos disponibles para este producto
        const availableCodes = await GameCode.find({
          product: product._id,
          status: 'available',
          used: false
        }).limit(item.quantity);

        if (availableCodes.length < item.quantity) {
          console.error(`⚠️ No hay suficientes códigos para ${product.name}`);
          continue;
        }

        // Asignar códigos al usuario
        for (const gameCode of availableCodes) {
          gameCode.status = 'sold';
          gameCode.used = true;
          gameCode.usedBy = order.user;
          gameCode.usedAt = new Date();
          gameCode.orderId = order._id;
          await gameCode.save();

          deliveredProducts.push({
            productId: product._id,
            gameCodeId: gameCode._id,
            delivered: true,
            deliveredAt: new Date()
          });
        }
      }
    }

    // Actualizar orden con productos entregados
    order.digitalProducts = deliveredProducts;

    // Si todos los productos fueron entregados, completar la orden
    if (order.areAllProductsDelivered()) {
      await order.complete();
    } else {
      await order.save();
    }

    return deliveredProducts;

  } catch (error) {
    console.error('Error al entregar productos digitales:', error);
    throw error;
  }
};

/**
 * Consultar estado de un pago
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    // Verificar que el pago pertenece al usuario
    if (payment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este pago'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error al consultar pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar pago',
      error: error.message
    });
  }
};

/**
 * Obtener historial de pagos del usuario
 */
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, page = 1 } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('orderId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos',
      error: error.message
    });
  }
};

module.exports = {
  createPaymentPreference,
  handleWebhook,
  getPaymentStatus,
  getUserPayments,
};