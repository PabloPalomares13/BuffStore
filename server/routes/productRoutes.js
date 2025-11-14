const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/Product');
const { uploadFileToGCS, deleteFileFromGCS, generateFileName, processAndUploadVideo } = require('../config/storage');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Configuración de multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|webp/;
    const allowedVideoTypes = /mp4|webm/;
    const mimetype = file.mimetype;

    if (mimetype.startsWith('image/') && allowedImageTypes.test(mimetype)) {
      cb(null, true);
    } else if (mimetype.startsWith('video/') && allowedVideoTypes.test(mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPG, PNG, WebP) y videos (MP4, WebM)'), false);
    }
  }
});

// Crear producto
router.post('/', protect, isAdmin, upload.fields([{ name: 'images', maxCount: 10 },{ name: 'videos', maxCount: 2 }]), async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      images: [],
      media: []
    });

    const savedProduct = await product.save();

    const GameCode = require('../models/GameCode');
    const crypto = require('crypto');
    const mediaItems = [];

    const generateCodesForProduct = async (productId, stock) => {
      const codes = [];
      for (let i = 0; i < stock; i++) {
        const code = crypto.randomBytes(6).toString('hex').toUpperCase();
        codes.push({ product: productId, code });
      }
      await GameCode.insertMany(codes);
      console.log(`${codes.length} códigos generados para el producto ${productId}`);
    };

    if (savedProduct.stock > 0) {
      await generateCodesForProduct(savedProduct._id, savedProduct.stock);
    }

    if (req.files.images && req.files.images.length > 0) {
      for (let i = 0; i < req.files.images.length; i++) {
        const file = req.files.images[i];
        const fileName = generateFileName(file.originalname, savedProduct._id, i);

        try {
          const imageUrl = await uploadFileToGCS(file, fileName);
          mediaItems.push({
            type: 'image',
            url: imageUrl,
            fileName: fileName,
            order: i
          });
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
        }
      }
    }
    if (req.files.videos && req.files.videos.length > 0) {
      const videoCount = Math.min(req.files.videos.length, 2);
      
      for (let i = 0; i < videoCount; i++) {
        const file = req.files.videos[i];
        const videoFileName = `products/${savedProduct._id}/videos/${Date.now()}_${i}.mp4`;

        try {
          const { rawVideoUrl, processing } = await processAndUploadVideo(
            file, 
            videoFileName, 
            savedProduct._id
          );
          
          mediaItems.push({
            type: 'video',
            url: rawVideoUrl,
            thumbnail: '',
            fileName: videoFileName,
            order: mediaItems.length,
            processing: processing
          });
        } catch (uploadError) {
          console.error('Error uploading video:', uploadError);
        }
      }
    }
    savedProduct.images = mediaItems.filter(m => m.type === 'image').map(m => m.url);
    savedProduct.media = mediaItems;
    await savedProduct.save();

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
router.put('/:id', protect, isAdmin, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 2 }
]), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // 1. ACTUALIZAR CAMPOS BÁSICOS (sin tocar media)
    const fieldsToUpdate = ['name', 'code', 'description', 'price', 'stock', 'taxRate', 'category', 'tags', 'brand', 'vendor'];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // 2. MANEJAR ELIMINACIÓN DE ARCHIVOS (si se solicita)
    if (req.body.deleteMedia) {
      const filesToDelete = JSON.parse(req.body.deleteMedia);
      
      for (const fileName of filesToDelete) {
        try {
          await deleteFileFromGCS(fileName);
          // Remover del array media
          product.media = product.media.filter(m => m.fileName !== fileName);
          console.log(`Archivo eliminado: ${fileName}`);
        } catch (error) {
          console.error('Error deleting file:', fileName, error);
        }
      }
    }

    // 3. AGREGAR NUEVAS IMÁGENES (sin borrar las existentes)
    if (req.files?.images && req.files.images.length > 0) {
      for (let i = 0; i < req.files.images.length; i++) {
        const file = req.files.images[i];
        const fileName = generateFileName(file.originalname, product._id, Date.now() + i);

        try {
          const imageUrl = await uploadFileToGCS(file, fileName);
          
          // PUSH (agregar) en vez de reemplazar
          product.media.push({
            type: 'image',
            url: imageUrl,
            fileName: fileName,
            order: product.media.length,
            uploadedAt: new Date()
          });
          
          console.log(`Nueva imagen agregada: ${fileName}`);
        } catch (uploadError) {
          console.error('Error uploading new image:', uploadError);
        }
      }
    }

    // 4. AGREGAR NUEVOS VIDEOS (sin borrar los existentes)
    if (req.files?.videos && req.files.videos.length > 0) {
      const videoCount = Math.min(req.files.videos.length, 2);
      
      for (let i = 0; i < videoCount; i++) {
        const file = req.files.videos[i];
        const videoFileName = `products/${product._id}/videos/${Date.now()}_${i}.mp4`;

        try {
          const { rawVideoUrl, processing } = await processAndUploadVideo(
            file, 
            videoFileName, 
            product._id
          );
          
          // PUSH (agregar) en vez de reemplazar
          product.media.push({
            type: 'video',
            url: rawVideoUrl,
            thumbnail: '',
            fileName: videoFileName,
            order: product.media.length,
            processing: processing,
            uploadedAt: new Date()
          });
          
          console.log(`Nuevo video agregado: ${videoFileName}`);
        } catch (uploadError) {
          console.error('Error uploading new video:', uploadError);
        }
      }
    }

    // 5. ACTUALIZAR ARRAY images[] (para compatibilidad con código antiguo)
    product.images = product.media
      .filter(m => m.type === 'image')
      .map(m => m.url);

    // 6. ACTUALIZAR CÓDIGOS DE JUEGO (si cambió el stock)
    const GameCode = require('../models/GameCode');
    const currentCodes = await GameCode.countDocuments({ product: product._id });
    
    if (product.stock > currentCodes) {
      const codesToGenerate = product.stock - currentCodes;
      const crypto = require('crypto');
      const newCodes = [];
      
      for (let i = 0; i < codesToGenerate; i++) {
        const code = crypto.randomBytes(6).toString('hex').toUpperCase();
        newCodes.push({ product: product._id, code });
      }
      
      await GameCode.insertMany(newCodes);
      console.log(`${newCodes.length} nuevos códigos generados`);
    }

    // 7. GUARDAR CAMBIOS
    await product.save();
    
    res.json(product);
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

    // Eliminar todos los archivos de GCS (imágenes Y videos)
    if (product.media && product.media.length > 0) {
      for (const mediaItem of product.media) {
        try {
          await deleteFileFromGCS(mediaItem.fileName);
          console.log(`Archivo eliminado: ${mediaItem.fileName}`);
        } catch (deleteError) {
          console.error('Error deleting file:', mediaItem.fileName, deleteError);
        }
      }
    }
    // Eliminar códigos de juego asociados
    const GameCode = require('../models/GameCode');
    await GameCode.deleteMany({ product: product._id });
    console.log(`Códigos de juego eliminados para producto ${product._id}`);

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Producto eliminado con éxito' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
