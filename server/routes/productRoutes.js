const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/Product');
const { uploadFileToGCS, deleteFileFromGCS, generateFileName, generatePosterFileName, processAndUploadVideo } = require('../config/storage');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { getFeaturedProducts, searchProducts  } = require('../Controllers/productControllers');

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

// Genera un código único de 2 letras + 3 números (ej: "AB123"), verificando
// contra la base de datos. Reintenta si hay colisión.
const generateUniqueProductCode = async () => {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const maxIntentos = 10;

  for (let intento = 0; intento < maxIntentos; intento++) {
    const l1 = letras[Math.floor(Math.random() * letras.length)];
    const l2 = letras[Math.floor(Math.random() * letras.length)];
    const numeros = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const code = `${l1}${l2}${numeros}`;

    const existe = await Product.findOne({ code }).select('_id').lean();
    if (!existe) return code;
  }

  return `XX${Date.now().toString().slice(-3)}`;
};
 const parseArrayField = (value) => {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch (e) {
    // no era JSON: lo tratamos como lista separada por comas
    return String(value).split(',').map((v) => v.trim()).filter(Boolean);
  }
};
// Crear producto
router.post('/', protect, isAdmin, upload.fields([{ name: 'images', maxCount: 10 },{ name: 'videos', maxCount: 2 },{ name: 'poster', maxCount: 1 }]), async (req, res) => {
  try {

    const tags = parseArrayField(req.body.tags);
    const platformsFull = parseArrayField(req.body.platformsFull);
    const genres = parseArrayField(req.body.genres);
    const rawgTags = parseArrayField(req.body.rawgTags);

    // El código SIEMPRE se genera en el backend, nunca se confía en uno
    // que venga del cliente (req.body.code, si llegara, se ignora).
    const code = await generateUniqueProductCode();

    const product = new Product({
      ...req.body,
      code,
      tags,
      genres,
      rawgTags,
      platformsFull,
      media: []
    });

    const savedProduct = await product.save();

    // Parsear los flags de "procesar o no" que manda el admin para cada video
    let videoProcessFlags = [];
    if (req.body.videoProcessFlags) {
      try {
        videoProcessFlags = JSON.parse(req.body.videoProcessFlags);
      } catch (e) {
        console.error('videoProcessFlags inválido:', e.message);
      }
    }

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

        // Toma el flag de este video específico, default true si no llegó
        const shouldProcess = videoProcessFlags[i] !== undefined ? videoProcessFlags[i] : true;

        try {
          const { rawVideoUrl, processing } = await processAndUploadVideo(
            file,
            videoFileName,
            savedProduct._id,
            shouldProcess
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

    // Foto de portada: SIEMPRE type: 'image' (el schema no acepta 'poster'
    // como valor de "type"), la distinción es isPoster: true.
    if (req.files.poster && req.files.poster.length > 0) {
      const posterFile = req.files.poster[0];
      const posterFileName = generatePosterFileName(posterFile.originalname, savedProduct._id);

      try {
        const posterUrl = await uploadFileToGCS(posterFile, posterFileName);
        mediaItems.push({
          type: 'image',
          url: posterUrl,
          fileName: posterFileName,
          order: mediaItems.length,
          isPoster: true
        });
      } catch (uploadError) {
        console.error('Error uploading poster/poster:', uploadError);
      }
    }

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

router.get('/featured', getFeaturedProducts);

router.get('/search', searchProducts);

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
  { name: 'poster', maxCount: 1 },
  { name: 'videos', maxCount: 2 }
]), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Parsear los flags de "procesar o no" que manda el admin
    let videoProcessFlags = [];
    if (req.body.videoProcessFlags) {
      try {
        videoProcessFlags = JSON.parse(req.body.videoProcessFlags);
      } catch (e) {
        console.error('videoProcessFlags inválido:', e.message);
      }
    }

    // 1. ACTUALIZAR CAMPOS BÁSICOS (sin tocar media)
    const fieldsToUpdate = [
      'name', 'code', 'description', 'price', 'stock', 'taxRate', 'category', 'brand', 'vendor',
      // Metadata de RAWG.io — antes faltaban, se perdían al editar desde Modproducto.jsx
      'rawgId', 'releaseDate', 'rating', 'ratingsCount', 'metacritic', 'esrbRating', 'genres' , 'website', 'rawgTags',
    ];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // 1.5 CAMPOS QUE LLEGAN COMO JSON.stringify (arrays)
    if (req.body.tags !== undefined) {
      try {
        product.tags = JSON.parse(req.body.tags);
      } catch (e) {
        product.tags = [req.body.tags];
      }
    }
    if (req.body.platformsFull !== undefined) {
      try {
        product.platformsFull = JSON.parse(req.body.platformsFull);
      } catch (e) {
        product.platformsFull = [];
      }
    }

    // 2. MANEJAR ELIMINACIÓN DE ARCHIVOS (si se solicita)
    if (req.body.deleteMedia) {
      const filesToDelete = JSON.parse(req.body.deleteMedia);

      for (const fileName of filesToDelete) {
        try {
          await deleteFileFromGCS(fileName);
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

        const shouldProcess = videoProcessFlags[i] !== undefined ? videoProcessFlags[i] : true;

        try {
          const { rawVideoUrl, processing } = await processAndUploadVideo(
            file,
            videoFileName,
            product._id,
            shouldProcess
          );

          product.media.push({
            type: 'video',
            url: rawVideoUrl,
            thumbnail: '',
            fileName: videoFileName,
            order: product.media.length,
            processing: processing,
            uploadedAt: new Date()
          });

          console.log(`Nuevo video agregado: ${videoFileName} (procesar: ${shouldProcess})`);
        } catch (uploadError) {
          console.error('Error uploading new video:', uploadError);
        }
      }
    }

    // 4.5 REEMPLAZAR LA PORTADA (si mandan una nueva)
    // Antes este bloque no existía: el campo se llamaba "poster" en multer
    // pero nada lo procesaba, así que una portada nueva se perdía en silencio.
    if (req.files?.poster && req.files.poster.length > 0) {
      // Borra la portada anterior (archivo en GCS + entrada en media) para
      // no terminar con dos isPoster:true al mismo tiempo.
      const posterAnterior = product.media.find(m => m.isPoster);
      if (posterAnterior) {
        try {
          await deleteFileFromGCS(posterAnterior.fileName);
        } catch (err) {
          console.error('Error borrando portada anterior:', err);
        }
        product.media = product.media.filter(m => !m.isPoster);
      }

      const posterFile = req.files.poster[0];
      const posterFileName = generatePosterFileName(posterFile.originalname, product._id);

      try {
        const posterUrl = await uploadFileToGCS(posterFile, posterFileName);
        product.media.push({
          type: 'image',
          url: posterUrl,
          fileName: posterFileName,
          order: product.media.length,
          isPoster: true,
          uploadedAt: new Date()
        });
        console.log(`Portada reemplazada: ${posterFileName}`);
      } catch (uploadError) {
        console.error('Error uploading new poster:', uploadError);
      }
    }

    // 5. ACTUALIZAR CÓDIGOS DE JUEGO (si cambió el stock)
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

    // 6. GUARDAR CAMBIOS
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
