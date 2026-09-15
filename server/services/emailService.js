const { resend } = require("../config/resendConfig");
const VerificationCodeEmail = require("../emails/verificationCodeEmail.jsx")
const OrderCodeEmail = require("../emails/OrderCodeEmail.jsx").default;
 
/**
 * Envía un correo con código de verificación. Reutilizable desde
 * authController.js u otros: registro, login con 2FA, recuperación
 * de contraseña, etc.
 *
 * @param {Object} params
 * @param {string} params.to - correo destino
 * @param {string} params.code - código (ideal 6 dígitos numéricos)
 * @param {number} [params.expiresInMinutes]
 * @param {string} [params.actionLabel] - p. ej. "verificar tu cuenta", "restablecer tu contraseña"
 */
async function sendVerificationCode({
  to,
  code,
  expiresInMinutes = 10,
  actionLabel = "verificar tu cuenta",
}) {
  const { data, error } = await resend.emails.send({
    from: "Seguridad <onboarding@resend.dev>",
    to: ["pablopalomedi@gmail.com"], 
    subject: `Tu código es ${code}`,
    react: VerificationCodeEmail({ code, expiresInMinutes, actionLabel }),
  });
 
  if (error) {
    throw new Error(`No se pudo enviar el código: ${error.message || error}`);
  }
 
  return data;
}
 
module.exports = { sendVerificationCode, sendOrderCodesEmail };
 
/**
 * Envía al cliente el/los código(s) de juego de un pedido ya pagado.
 *
 * @param {Object} params
 * @param {string} params.to - correo del cliente
 * @param {string} params.nombre - nombre del cliente
 * @param {string} params.orderId
 * @param {{ productName: string, code: string }[]} params.items
 */
async function sendOrderCodesEmail({ to, nombre, orderId, items }) {
  const { data, error } = await resend.emails.send({
    from: "Pedidos <onboarding@resend.dev>",
    to: ["pablopalomedi@gmail.com"], 
    subject: `Tu(s) código(s) del pedido #${String(orderId).slice(-8)}`,
    react: OrderCodeEmail({ nombre, orderId, items }),
  });
 
  if (error) {
    throw new Error(`No se pudo enviar el correo del pedido: ${error.message || error}`);
  }
 
  return data;
}