const { resend } = require("../config/resendConfig");
const ContactNotificationEmail = require("../emails/contactNotificationEmails.js").default;
 
const sendContactMessage = async (req, res) => {
  const { nombre, correo, mensaje } = req.body;
 
  if (!nombre || !correo || !mensaje) {
    return res.status(400).json({ error: "Faltan campos requeridos." });
  }
 
  try {
    const { data, error } = await resend.emails.send({
      // Usa un dominio verificado en producción, p. ej. "Contacto <hola@tudominio.com>"
      from: "Contacto <onboarding@resend.dev>",
      to: ["pablopalomedi@gmail.com"],
      reply_to: correo,
      subject: `Nuevo mensaje de ${nombre}`,
      react: ContactNotificationEmail({ nombre, correo, mensaje }),
    });
 
    if (error) {
      console.error("Resend error:", error);
      return res.status(502).json({ error: "No se pudo enviar el correo." });
    }
 
    return res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Error inesperado enviando el correo:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};
 
module.exports = { sendContactMessage };