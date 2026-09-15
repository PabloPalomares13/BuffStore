const { Resend } = require("resend");
 
// Necesitas la variable de entorno RESEND_API_KEY (dashboard.resend.com)
// y, para producción, un dominio verificado en Resend para el remitente.
const resend = new Resend(process.env.RESEND_API_KEY);
 
module.exports = { resend };