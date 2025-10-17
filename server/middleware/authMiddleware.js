const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  
  // Verificar si existe un token en el header de autorización
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obtener el token del header
      token = req.headers.authorization.split(' ')[1];
      
      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Obtener el usuario desde la base de datos
      // req.user = await userOperations.findById(decoded.id, '-password');
      req.user = await User.findById(decoded.id).select('-password');
      
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'No autorizado, token fallido' });
    }
  }
  
  if (!token) {
    res.status(401).json({ message: 'No autorizado, no hay token' });
  }
};

module.exports = { protect };