
const express = require('express');
const router = express.Router();
const geminiController = require('../Controllers/geminiController');

// Ruta para procesar mensajes de texto
router.post('/text', geminiController.processTextMessage);

// Ruta para procesar imágenes
router.post('/image', geminiController.processImage);

module.exports = router;