const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization;
  return header && header.startsWith('Bearer') ? header.split(' ')[1] : null;
};

// Ruta protegida: exige un token válido
const protect = async (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({ message: 'No autorizado, no hay token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    // Token válido pero el usuario ya no existe
    if (!user) {
      return res.status(401).json({ message: 'No autorizado, usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'No autorizado, token fallido' });
  }
};

// Ruta pública que, si llega un token válido, identifica al usuario.
// Nunca responde 401: si no hay token o es inválido, sigue sin req.user.
const optionalAuth = async (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      req.user = null;
    }
  }

  next();
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado: solo para administradores' });
  }
};

module.exports = { protect, optionalAuth, isAdmin };