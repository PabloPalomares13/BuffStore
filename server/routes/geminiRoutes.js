const express = require('express');
const router = express.Router();
const geminiController = require('../Controllers/geminiController');
const { identifyChatUser } = require('../middleware/chatContext');
const { chatRateLimit } = require('../middleware/chatRateLimit');
 
// identifyChatUser: decide req.chatRole ('admin' | 'user' | 'guest') sin bloquear
//                    si no hay token (el chat también sirve a invitados).
// chatRateLimit: limita mensajes por rol/tiempo, usando el rol ya calculado.
router.post('/text', identifyChatUser, chatRateLimit, geminiController.processTextMessage);
 
// La identificación de imagen (carátulas) la dejamos libre por ahora, ya que
// no toca la base de datos. Si más adelante quieres limitarla igual, agrega
// aquí los mismos dos middlewares.
router.post('/image', geminiController.processImage);
 
module.exports = router;
 