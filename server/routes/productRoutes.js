const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const fs = require('fs');

// Configuración de multer para guardar imágenes
const storage = multer.memoryStorage();

const upload = multer({ storage });

// Crear producto
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const imageObjects = req.files.map(file => ({
      data: file.buffer || fs.readFileSync(file.path),
      contentType: file.mimetype
    }));
    
    const product = new Product({ 
      ...req.body, 
      images: imageObjects 
    });
    
    await product.save();
    res.status(201).json(product);
  } catch (error) {
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
router.put('/:id', upload.array('images', 5), async (req, res) => {
  try {
    const updatedData = { ...req.body };
    
    if (req.files && req.files.length > 0) {
      const imageObjects = req.files.map(file => ({
        data: file.buffer || fs.readFileSync(file.path),
        contentType: file.mimetype
      }));
      updatedData.images = imageObjects;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar producto
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/image/:id/:index', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.images || !product.images[req.params.index]) {
      return res.status(404).send('Imagen no encontrada');
    }
    
    const image = product.images[req.params.index];
    res.set('Content-Type', image.contentType);
    res.send(image.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
