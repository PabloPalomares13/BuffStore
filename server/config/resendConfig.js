const { Resend } = require("resend");
 
// Requiere RESEND_API_KEY en server/.env
const resend = new Resend(process.env.RESEND_API_KEY);
 
module.exports = { resend };