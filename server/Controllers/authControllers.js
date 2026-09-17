const User = require('../models/User');
const jwt = require('jsonwebtoken');
const storage = require('../config/storage');
// Generar JWT con rol incluido
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '60m' // Token expira en 30 minutos
  });
};

// @desc    Registrar usuario
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const {  email, password } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({
       email});

    if (userExists) {
      return res.status(400).json({
        message: 'Usuario ya existe con ese email o ID personal'
      });
    }

    // Verificar cantidad de usuarios (si es el primero, será admin)
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    // Crear nuevo usuario con rol
    const user = await User.create({
      email,
      password,
      role
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role)
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

    const user = await User.findOne({ email });

    // Si el usuario existe y la contraseña coincide
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role)
      });
    } else {
      res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// @desc    Obtener datos del usuario autenticado
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      // user.toJSON() (definido en el modelo) ya quita el password.
      // Devolvemos el documento completo para incluir fullName, nickname,
      // phone, birthDate, billingAddress y avatarUrl sin tener que listar
      // cada campo a mano.
      res.json(user);
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// @desc    Actualizar datos del perfil del usuario autenticado
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const {
      fullName,
      nickname,
      phone,
      birthDate,
      billingAddress,
      avatarUrl,
      email,
    } = req.body;

    // El email cambia el identificador de login, así que se valida aparte
    if (email !== undefined && email !== user.email) {
      const emailTaken = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailTaken) {
        return res.status(400).json({ message: 'Ese email ya está en uso' });
      }
      user.email = email;
    }

    // El nickname es único (índice sparse), así que también se valida
    if (nickname !== undefined && nickname !== user.nickname) {
      if (nickname) {
        const nicknameTaken = await User.findOne({
          nickname,
          _id: { $ne: user._id },
        });
        if (nicknameTaken) {
          return res.status(400).json({ message: 'Ese nickname ya está en uso' });
        }
      }
      user.nickname = nickname;
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (birthDate !== undefined) user.birthDate = birthDate || null;
    if (billingAddress !== undefined) user.billingAddress = billingAddress;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ninguna imagen' });
    }
 
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
 
    // Carpeta separada de products/ dentro del mismo bucket
    const destination = `avatars/${user._id}/${Date.now()}_${req.file.originalname}`;
 
    const avatarUrl = await storage.uploadFileToGCS(req.file, destination);
 
    user.avatarUrl = avatarUrl;
    await user.save();
 
    res.json({ avatarUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al subir la foto de perfil', error: error.message });
  }
};
 
module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadAvatar
};