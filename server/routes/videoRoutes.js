const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.post('/callback', async (req, res) => {
  try {
    const { success, videoUrl, thumbnailUrl, originalFileName, processedFileName, productId, error } = req.body;

    if (!success) {
      console.error('Video processing failed:', error);
      return res.status(200).json({ message: 'Error logged' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const mediaIndex = product.media.findIndex(m => m.fileName === originalFileName);
    
    if (mediaIndex !== -1) {
      product.media[mediaIndex].url = videoUrl;
      product.media[mediaIndex].thumbnail = thumbnailUrl;
      product.media[mediaIndex].fileName = processedFileName;
      product.media[mediaIndex].processing = false;
      
      await product.save();
    }

    res.json({ message: 'Video processed successfully' });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;