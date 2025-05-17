const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const path = require('path');
const cors = require('cors');
 const { initializeConnections } = require('./services/dbService');
require('dotenv').config();


if (!process.env.JWT_SECRET) {
    console.error('CRITICAL ERROR: JWT_SECRET is not defined in environment variables');
    process.exit(1);
  }

  if (!process.env.MONGO_LOCAL_URI) {
      console.warn('WARNING: MONGO_LOCAL_URI is not defined. Using default: mongodb://localhost:27017/buffstore-mirror');
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


app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/gemini', geminiRoutes);

initializeConnections()
  .then(success => {
    if (success) {
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } else {
      console.error('No se pudieron inicializar las conexiones a las bases de datos');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error al inicializar las conexiones:', err);
    process.exit(1);
  });
// mongoose.connect(process.env.MONGO_URI)
// .then(() => console.log('MongoDB connected'))
// .catch(err => console.error(err));

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));