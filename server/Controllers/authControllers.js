const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generar JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30m' // Token expira en 30 minutos
  });
};

const registerUser = async (req, res) => {
  try {
    const { typeID, personalID, email, password } = req.body;
    
    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ 
      $or: [{ email }, { personalID }] 
    });
    
    if (userExists) {
      return res.status(400).json({ 
        message: 'Usuario ya existe con ese email o ID personal' 
      });
    }
    // Crear nuevo usuario
    const user = await User.create({
      typeID,
      personalID,
      email,
      password
    });
    
    if (user) {
      res.status(201).json({
        _id: user._id,
        typeID: user.typeID,
        personalID: user.personalID,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// @desc    Autenticar usuario y obtener token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verificar si existe el usuario
    const user = await User.findOne({ email });
    
    // Si el usuario existe y la contraseña coincide
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        typeID: user.typeID,
        personalID: user.personalID,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// @desc    Obtener datos del usuario
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user) {
      res.json({
        _id: user._id,
        typeID: user.typeID,
        personalID: user.personalID,
        email: user.email
      });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};