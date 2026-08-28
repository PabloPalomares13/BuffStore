// server/config/mercadopagoConfig.js
const mercadopago = require('mercadopago');
const { MercadoPagoConfig } = require('mercadopago');

let mpClient; // cliente reutilizable

// Configuración del cliente de Mercado Pago
const configureMercadoPago = () => {
  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('❌ ERROR: MP_ACCESS_TOKEN no está configurado en las variables de entorno');
    throw new Error('Mercado Pago Access Token no configurado');
  }

  mpClient = new MercadoPagoConfig({
    accessToken
  });

  console.log('✅ Mercado Pago configurado correctamente (SDK actual)');
};

// Obtener cliente configurado
const getMercadoPagoClient = () => {
  if (!mpClient) {
    throw new Error('Mercado Pago no ha sido configurado. Llama a configureMercadoPago() primero.');
  }
  return mpClient;
};

// Configuración para diferentes países
const CURRENCY_CONFIG = {
  CO: 'COP',
  AR: 'ARS',
  MX: 'MXN',
  BR: 'BRL',
  CL: 'CLP',
  PE: 'PEN',
  UY: 'UYU',
};

// URLs de notificación (webhooks)
const getNotificationUrls = () => {
  const baseUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.BASE_URL ||
    'http://localhost:3000';

  return {
    success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success`,
    failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/failure`,
    pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/pending`,
    notification: `${baseUrl}/api/payments/webhook`,
  };
};

// Configuración por defecto para preferencias de pago
const getDefaultPreferenceConfig = () => {
  return {
    payment_methods: {
      excluded_payment_methods: [],
      excluded_payment_types: [],
      installments: 12,
    },
    back_urls: getNotificationUrls(),
    auto_return: 'approved',
    binary_mode: false,
    expires: true,
    expiration_date_from: null,
    expiration_date_to: null,
  };
};

module.exports = {
  configureMercadoPago,
  getMercadoPagoClient,
  CURRENCY_CONFIG,
  getNotificationUrls,
  getDefaultPreferenceConfig,
  mercadopago
};
