const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const { 
  registerUser, 
  loginUser, 
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
} = require('../Controllers/authControllers');
const { protect } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas protegidas
router.get('/profile', protect, getUserProfile);

router.put('/profile', protect, updateUserProfile);

router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
module.exports = router;