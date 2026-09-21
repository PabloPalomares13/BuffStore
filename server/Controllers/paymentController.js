const mercadopago = require('mercadopago');
const { getNotificationUrls, getDefaultPreferenceConfig, CURRENCY_CONFIG } = require('../config/mercadopagoConfig');
const Payment = require('../models/schemas/Payment');
const Order = require('../models/Order');
const GameCode = require('../models/GameCode');
//const User = require('../models/User');
const { sendOrderCodesEmail } = require('../services/emailService'); // desactivado temporalmente
const Product = require('../models/Product');

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
    // const user = await User.findById(userId);

    // 5. Preparar items para Mercado Pago (usando datos ya guardados en order.products)
    const currency = CURRENCY_CONFIG.CO;
    const dbProducts = await Product.find({
      _id: { $in: order.products.map(i => i.productId) },
    });
    const byId = new Map(dbProducts.map(p => [p._id.toString(), p]));

    let taxesRaw = 0;
    const items = order.products.map(item => {
      const p = byId.get(item.productId.toString());
      if (!p) throw new Error(`Producto no encontrado: ${item.productId}`);

      const unit = Math.round(p.price);
      const rate = (p.taxRate ?? 8) / 100; // taxRate guardado en porcentaje
      taxesRaw += unit * item.quantity * rate;

      return {
        id: p._id.toString(),
        title: p.name,
        quantity: item.quantity,
        unit_price: unit,
        currency_id: currency,
      };
    });

    // El impuesto va como un item aparte para que el total cobrado incluya el IVA
    const taxes = Math.round(taxesRaw);
    if (taxes > 0) {
      items.push({
        id: 'iva',
        title: 'Impuestos (IVA)',
        quantity: 1,
        unit_price: taxes,
        currency_id: currency,
      });
    }

    const chargeTotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    order.totals = { subtotal: chargeTotal - taxes, taxes, total: chargeTotal };
    // 6. Configurar preferencia de pago (defaults + overrides específicos de esta orden)
    const urls = getNotificationUrls();
    console.log('🔗 URLs configuradas:', urls);

    const preferenceData = {
      items,
      back_urls: {
        success: urls.success,
        failure: urls.failure,
        pending: urls.pending,
      },
      payment_methods: { installments: 12 },
      notification_url: urls.notification,
      external_reference: orderId.toString(),
    };

    // Si la URL no es localhost, podemos habilitar auto_return
    const isLocal = !process.env.FRONTEND_URL || process.env.FRONTEND_URL.includes('localhost');
    if (!isLocal) {
      preferenceData.auto_return = 'approved';
    }

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
      amount: chargeTotal,  
      currency: 'COP',
      status: 'pending',
      description: `Orden #${order._id.toString().slice(-8)} - ${order.products.length} producto(s)`,
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
/**
 * Procesa el resultado de un pago ya consultado a Mercado Pago:
 * actualiza el registro de Payment, marca la orden como pagada y
 * entrega los códigos digitales si corresponde. La usan tanto el
 * webhook como el endpoint de verificación manual (fallback para
 * cuando el webhook de sandbox no llega, ej: merchant_order bloqueado).
 *
 * Es idempotente: si el pago ya estaba marcado como 'approved' en
 * nuestra DB, no vuelve a entregar códigos ni a mandar el correo.
 */
const processPaymentResult = async (paymentData) => {
  console.log('💳 Información del pago:', {
    id: paymentData.id,
    status: paymentData.status,
    status_detail: paymentData.status_detail,
    external_reference: paymentData.external_reference,
  });

  const orderId = paymentData.external_reference;
  const payment = await Payment.findOne({ orderId });

  if (!payment) {
    console.error('❌ Pago no encontrado en DB:', orderId);
    return { ok: false, reason: 'payment_not_found' };
  }

  // Idempotencia: si ya estaba aprobado, no repetir la entrega/correo
  if (payment.status === 'approved' && paymentData.status === 'approved') {
    console.log('ℹ️ Este pago ya había sido procesado como aprobado, se omite.');
    return { ok: true, alreadyProcessed: true, status: paymentData.status };
  }

  payment.mercadoPagoId = paymentData.id.toString();
  payment.status = paymentData.status;
  payment.statusDetail = paymentData.status_detail;

  if (paymentData.payment_method_id) {
    payment.paymentMethod = {
      type: paymentData.payment_type_id,
      id: paymentData.payment_method_id,
      last_four_digits: paymentData.card?.last_four_digits,
      cardholder_name: paymentData.card?.cardholder?.name,
    };
  }

  payment.rawResponse = paymentData;

  if (paymentData.status === 'approved') {
    payment.approvedAt = new Date();
    await payment.save();

    const order = await Order.findById(orderId).populate('products.productId');

    // Si la orden ya estaba pagada (ej: el webhook la marcó justo antes
    // de que el frontend llame al fallback), no la procesamos dos veces
    if (order.paymentStatus !== 'paid') {
      await order.markAsPaid(payment._id);
      await deliverDigitalProducts(order);
      console.log('✅ Pago aprobado y productos entregados');
    } else {
      console.log('ℹ️ La orden ya estaba marcada como pagada, se omite entrega duplicada.');
    }
  } else {
    await payment.save();
    console.log('⏳ Pago en estado:', paymentData.status);
  }

  return { ok: true, status: paymentData.status };
};

const handleWebhook = async (req, res) => {
  // Mercado Pago manda notificaciones en DOS formatos distintos según el flujo:
  // - Formato nuevo: { type: 'payment', data: { id } } en el body, y a veces
  //   como query string ?data.id=...&type=payment
  // - IPN viejo: ?topic=payment|merchant_order&id=... en la query string,
  //   con un body { resource, topic }
  const type = req.body?.type || req.query?.type || req.query?.topic;
  const rawId = req.body?.data?.id || req.query?.['data.id'] || req.query?.id;

  console.log('📨 Webhook recibido:', { type, rawId, query: req.query, body: req.body });

  // Respondemos 200 YA, antes de procesar nada. Mercado Pago espera un ACK
  // rápido; si tardamos consultando el pago o algo falla del lado nuestro,
  // no queremos que MP lo interprete como fallo y reintente en bucle.
  res.status(200).send('OK');

  if (!type || !rawId) {
    return;
  }

  // Las notificaciones de tipo merchant_order están bloqueadas por una
  // política de Mercado Pago en cuentas de prueba/sandbox
  // (PA_UNAUTHORIZED_RESULT_FROM_POLICIES). No hace falta consultarlas:
  // Mercado Pago también manda una notificación aparte de type: 'payment'
  // con toda la info que necesitamos, así que simplemente la ignoramos.
  if (type === 'merchant_order') {
    try {
      const client = new mercadopago.MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN
      });
      const moClient = new mercadopago.MerchantOrder(client);
      const moData = await moClient.get({ merchantOrderId: rawId });

      console.log('📦 Diagnóstico de Merchant Order [ID:', rawId + ']:');
      console.log('   - Estado de la orden:', moData.status, `(${moData.order_status})`);
      console.log('   - Total de pagos asociados:', moData.payments?.length || 0);

      if (moData.payments && moData.payments.length > 0) {
        moData.payments.forEach((p, idx) => {
          console.log(`   💳 Intento de pago #${idx + 1}:`, {
            id: p.id,
            status: p.status,
            status_detail: p.status_detail,
            payment_method_id: p.payment_method_id,
            transaction_amount: p.transaction_amount
          });
        });
      } else {
        console.log('   ⚠️ ATENCIÓN: No hay pagos registrados en esta orden (payments: []).');
        console.log('   👉 Mercado Pago bloqueó el intento en la pantalla de pago antes de crear el pago.');
        console.log('   Posibles causas:');
        console.log('      1. Iniciaste sesión con la cuenta Vendedora (autopago bloqueado).');
        console.log('      2. La sesión previa no se cerró en el navegador de pruebas.');
        console.log('      3. Los datos de la tarjeta de prueba fueron rechazados por el simulador.');
      }
    } catch (moErr) {
      console.error('⚠️ No se pudo consultar detalle de merchant_order:', moErr.message);
    }
    return;
  } else if (type !== 'payment') {
    return;
  }

  try {
    const client = new mercadopago.MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN
    });

    const paymentClient = new mercadopago.Payment(client);
    const paymentData = await paymentClient.get({ id: rawId });

    console.log('💳 Notificación de Pago Recibida [ID:', rawId + ']:', {
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      payment_method_id: paymentData.payment_method_id,
      payer_email: paymentData.payer?.email
    });

    if (paymentData.status !== 'approved') {
      console.log('⚠️ El pago NO fue aprobado:', {
        motivo: paymentData.status_detail,
        mensaje_sugerido: getStatusDetailMessage(paymentData.status_detail)
      });
    }

    await processPaymentResult(paymentData);

  } catch (error) {
    if (error?.status === 404 || error?.cause?.[0]?.code === 2000) {
      console.log('ℹ️ Pago no encontrado (probablemente simulación de prueba):', rawId);
      return;
    }
    console.error('❌ Error procesando webhook:', error?.message || error);
  }
};

// Función auxiliar para traducir status_detail de Mercado Pago
const getStatusDetailMessage = (statusDetail) => {
  const messages = {
    cc_rejected_bad_filled_card_number: 'Número de tarjeta incorrecto',
    cc_rejected_bad_filled_date: 'Fecha de vencimiento incorrecta',
    cc_rejected_bad_filled_other: 'Datos de la tarjeta incorrectos',
    cc_rejected_bad_filled_security_code: 'Código de seguridad (CVV) incorrecto',
    cc_rejected_call_for_authorize: 'Requiere llamar al banco para autorizar',
    cc_rejected_card_disabled: 'Tarjeta inhabilitada',
    cc_rejected_duplicated_payment: 'Pago duplicado',
    cc_rejected_high_risk: 'Rechazado por prevención de fraude',
    cc_rejected_insufficient_amount: 'Fondos insuficientes',
    cc_rejected_invalid_installments: 'Número de cuotas no válido',
    cc_rejected_max_attempts: 'Superaste el límite de intentos permitidos',
    cc_rejected_other_reason: 'Rechazado por políticas generales / datos incompatibles',
  };
  return messages[statusDetail] || statusDetail;
};

/**
 * Fallback para sandbox: el frontend llama esto desde /checkout/success
 * con el payment_id que Mercado Pago pone en la URL de retorno, por si
 * el webhook nunca llegó (ej: notificación merchant_order bloqueada).
 */
const verifyAndProcessPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'Falta paymentId' });
    }

    const client = new mercadopago.MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN
    });
    const paymentClient = new mercadopago.Payment(client);
    const paymentData = await paymentClient.get({ id: paymentId });

    const result = await processPaymentResult(paymentData);

    res.json({ success: result.ok, status: result.status, reason: result.reason });
  } catch (error) {
    console.error('❌ Error verificando pago manualmente:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Función auxiliar para entregar productos digitales
 */
const deliverDigitalProducts = async (order) => {
  try {
    // Conservamos lo ya entregado para que reprocesar la orden no duplique códigos
    const deliveredProducts = [...(order.digitalProducts || [])];
    const codesForEmail = [];
    const issues = [];

    for (const item of order.products) {
      const product = item.productId;

      if (!product) {
        console.error('⚠️ Item sin productId poblado, se omite:', item);
        issues.push(`Producto no encontrado: ${item.name}`);
        continue;
      }

      if (product.type && product.type !== 'digital') continue;

      // Cuántos códigos de este producto ya se entregaron en esta orden
      const alreadyDelivered = deliveredProducts.filter(
        d => d.productId?.toString() === product._id.toString()
      ).length;
      const pending = item.quantity - alreadyDelivered;
      if (pending <= 0) continue;

      // Reclamar cada código de forma atómica: solo uno de dos procesos
      // simultáneos puede pasar de 'valid' a 'used'
      for (let i = 0; i < pending; i++) {
        const gameCode = await GameCode.findOneAndUpdate(
          { product: product._id, status: 'valid' },
          {
            $set: {
              status: 'used',
              assignedTo: order.user,
              order: order._id,
              usedAt: new Date(),
            },
          },
          { new: true }
        );

        if (!gameCode) {
          console.error(`⚠️ Faltan códigos para ${product.name} (orden ${order._id})`);
          issues.push(`Faltan ${pending - i} código(s) de ${product.name}`);
          break;
        }

        deliveredProducts.push({
          productId: product._id,
          gameCodeId: gameCode._id,
          delivered: true,
          deliveredAt: new Date(),
        });

        codesForEmail.push({
          productName: product.name || item.name,
          code: gameCode.code,
        });
      }

      // Sincronizar el stock del producto con los códigos realmente disponibles
      const remaining = await GameCode.countDocuments({
        product: product._id,
        status: 'valid',
      });
      await Product.updateOne({ _id: product._id }, { $set: { stock: remaining } });
    }

    order.digitalProducts = deliveredProducts;
    if (issues.length) order.deliveryIssue = issues.join(' | ');

    if (order.areAllProductsDelivered()) {
      await order.complete();
    } else {
      await order.save();
    }

    if (codesForEmail.length > 0 && order.customer?.email) {
      try {
        await sendOrderCodesEmail({
          to: order.customer.email,
          nombre: order.customer.fullName || 'Cliente',
          orderId: order._id,
          items: codesForEmail,
        });
        console.log(`📧 Correo con códigos enviado a ${order.customer.email}`);
      } catch (emailError) {
        console.error('⚠️ No se pudo enviar el correo con los códigos:', emailError.message);
      }
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
  verifyAndProcessPayment,
};