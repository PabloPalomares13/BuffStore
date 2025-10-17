require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const { uploadFileToGCS, generateFileName } = require('./config/storage');


async function migrateImages() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Encontrar productos con imágenes en formato Buffer
    const products = await Product.find({
      'images.data': { $exists: true }
    });

    console.log(`Found ${products.length} products with binary images to migrate`);

    for (let product of products) {
      console.log(`Migrating product: ${product.name} (${product._id})`);
      
      const newImageUrls = [];
      
      if (product.images && Array.isArray(product.images)) {
        for (let i = 0; i < product.images.length; i++) {
          const image = product.images[i];
          
          // Solo migrar si tiene data (formato binario)
          if (image.data) {
            try {
              const fileName = generateFileName(`image_${i}.jpg`, product._id, i);
              
              // Crear un objeto similar a multer file
              const fileObject = {
                buffer: image.data,
                mimetype: image.contentType || 'image/jpeg'
              };
              
              const imageUrl = await uploadFileToGCS(fileObject, fileName);
              newImageUrls.push(imageUrl);
              console.log(`  ✓ Uploaded image ${i + 1}/${product.images.length}`);
              
            } catch (error) {
              console.error(`  ✗ Error uploading image ${i}:`, error.message);
            }
          }
        }
      }

      // Actualizar el producto con las nuevas URLs
      if (newImageUrls.length > 0) {
        await Product.findByIdAndUpdate(product._id, {
          images: newImageUrls
        });
        console.log(`  ✓ Updated product with ${newImageUrls.length} image URLs\n`);
      }
    }

    console.log('Migration completed!');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateImages();