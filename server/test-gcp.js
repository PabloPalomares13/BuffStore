
require('dotenv').config();

// Luego importa el storage
const { storage } = require('./config/storage');

async function testConnection() {
  try {
    const [buckets] = await storage.getBuckets();
    console.log('✅ Conexión exitosa!');
    console.log('Buckets disponibles:', buckets.map(b => b.name));
    console.log('Tiene GCS_PRIVATE_KEY?', !!process.env.GCS_PRIVATE_KEY);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConnection();