const ChatUsage = require('../models/ChatUsage');

// Ajusta estos números a lo que consideres "prudente" para tu costo de tokens.
const LIMITS = {
  admin: null, // sin límite
  user: { maxMessages: 20, windowMinutes: 10 },
  guest: { maxMessages: 8, windowMinutes: 10 }
};

// Requiere que identifyChatUser ya haya corrido antes (necesita req.chatRole / req.chatUser).
const chatRateLimit = async (req, res, next) => {
  const role = req.chatRole || 'guest';
  const limit = LIMITS[role];

  if (!limit) return next(); // admin sin límite

  const identifier = req.chatUser
    ? `user:${req.chatUser._id}`
    : `ip:${req.ip}`;

  const windowMs = limit.windowMinutes * 60 * 1000;
  const now = Date.now();
  // Redondeamos a ventanas fijas (ej. cada 10 minutos en punto) para no
  // necesitar un job de limpieza aparte del índice TTL del modelo.
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);

  try {
    const usage = await ChatUsage.findOneAndUpdate(
      { identifier, windowStart },
      { $inc: { messageCount: 1 } },
      { upsert: true, new: true }
    );

    if (usage.messageCount > limit.maxMessages) {
      const resetInMs = windowStart.getTime() + windowMs - now;
      const resetInMinutes = Math.max(1, Math.ceil(resetInMs / 60000));
      return res.status(429).json({
        error: `Has alcanzado el límite de mensajes del chat. Intenta de nuevo en ${resetInMinutes} minuto(s).`
      });
    }

    next();
  } catch (error) {
    console.error('Error en chatRateLimit:', error);
    // Si el rate limit falla por algo (ej. Mongo caído momentáneamente),
    // dejamos pasar el mensaje en vez de romper el chat.
    next();
  }
};

module.exports = { chatRateLimit };