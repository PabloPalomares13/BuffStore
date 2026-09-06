const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
 
router.post('/callback', async (req, res) => {
  try {
    const { success, videoUrl, thumbnailUrl, originalFileName, processedFileName, productId, error } = req.body;
 
    console.log('[video callback] Payload recibido:', {
      success, videoUrl, thumbnailUrl, originalFileName, processedFileName, productId
    });
 
    if (!success) {
      console.error('Video processing failed:', error);
      return res.status(200).json({ message: 'Error logged' });
    }
 
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
 
    const mediaIndex = product.media.findIndex(m => m.fileName === originalFileName);
 
    if (mediaIndex === -1) {
      console.error(`[video callback] No se encontró media con fileName: ${originalFileName} en producto ${productId}`);
      return res.status(200).json({ message: 'Media item not found, nothing updated' });
    }
 
    product.media[mediaIndex].url = videoUrl;
    product.media[mediaIndex].thumbnail = thumbnailUrl;
    product.media[mediaIndex].fileName = processedFileName;
    product.media[mediaIndex].processing = false;
 
    // NUEVO: fuerza a Mongoose a detectar el cambio dentro del array,
    // ya que la mutación de una propiedad de un elemento del array
    // a veces no se marca como modificada automáticamente.
    product.markModified('media');
 
    await product.save();
 
    // Verificación inmediata: relee el documento para confirmar que sí quedó guardado
    const verify = await Product.findById(productId).lean();
    console.log(
      '[video callback] Verificación post-save, thumbnail guardado:',
      verify.media[mediaIndex]?.thumbnail
    );
 
    res.json({ message: 'Video processed successfully' });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ error: error.message });
  }
});
 
module.exports = router;