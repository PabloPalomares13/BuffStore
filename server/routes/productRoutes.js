const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/Product');
const { uploadFileToGCS, deleteFileFromGCS, generateFileName } = require('../config/storage');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Configuración de multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite por archivo
  },
  fileFilter: (req, file, cb) => {
    // Filtrar solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// Crear producto
router.post('/', protect, isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    // Crear el producto primero para obtener el ID
    const product = new Product({ 
      ...req.body,
      images: [] // Inicialmente vacío
    });
    
    const savedProduct = await product.save();

    // Si hay archivos, subirlos a GCS
    if (req.files && req.files.length > 0) {
      const imageUrls = [];
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileName = generateFileName(file.originalname, savedProduct._id, i);
        
        try {
          const imageUrl = await uploadFileToGCS(file, fileName);
          imageUrls.push(imageUrl);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          // Si falla la subida de imagen, continuamos con las demás
        }
      }
      
      // Actualizar el producto con las URLs de las imágenes
      savedProduct.images = imageUrls;
      await savedProduct.save();
    }
    
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ error: error.message });
  }
});

// Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener producto por ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar producto
router.put('/:id', protect, isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const updatedData = { ...req.body };
    
    // Si se suben nuevas imágenes
    if (req.files && req.files.length > 0) {
      // Eliminar imágenes antiguas de GCS
      if (product.images && product.images.length > 0) {
        for (const imageUrl of product.images) {
          try {
            // Extraer el nombre del archivo de la URL
            const fileName = imageUrl.split('/').pop();
            const fullPath = `products/${product._id}/${fileName}`;
            await deleteFileFromGCS(fullPath);
          } catch (deleteError) {
            console.error('Error deleting old image:', deleteError);
          }
        }
      }

      // Subir nuevas imágenes
      const imageUrls = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileName = generateFileName(file.originalname, product._id, i);
        
        try {
          const imageUrl = await uploadFileToGCS(file, fileName);
          imageUrls.push(imageUrl);
        } catch (uploadError) {
          console.error('Error uploading new image:', uploadError);
        }
      }
      
      updatedData.images = imageUrls;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      updatedData, 
      { new: true }
    );
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ error: error.message });
  }
});

// Eliminar producto
router.delete('/:id', protect, isAdmin, async (req, res) => {

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    // Eliminar imágenes de GCS antes de eliminar el producto
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        try {
          // Extraer el nombre del archivo de la URL
          const fileName = imageUrl.split('/').pop();
          const fullPath = `products/${product._id}/${fileName}`;
          await deleteFileFromGCS(fullPath);
        } catch (deleteError) {
          console.error('Error deleting image:', deleteError);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Producto eliminado con éxito' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
