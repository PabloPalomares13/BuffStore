require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const gameCodeRoutes = require("./routes/gameCodesRoutes");
const path = require('path');
const cors = require('cors');


// Validar variables de entorno críticas
const requiredEnvVars = [
  'JWT_SECRET',
  'MONGO_URI',
  'GCS_PROJECT_ID',
  'GCS_PRIVATE_KEY_ID',
  'GCS_PRIVATE_KEY',
  'GCS_CLIENT_EMAIL',
  'GCS_CLIENT_ID',
  'GCS_BUCKET_NAME'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('CRITICAL ERROR: Missing environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const app = express();
const allowedOrigins = [
  'http://localhost:5173', // Vite frontend local
  'http://localhost:3000', // Backend local 
  'https://frontend-buffstore.onrender.com' // Producción
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS not allowed for this origin'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/gemini', geminiRoutes);
app.use("/api/codes", gameCodeRoutes);

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GCS Bucket: ${process.env.GCS_BUCKET_NAME}`);
});