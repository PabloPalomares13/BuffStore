const jwt = require('jsonwebtoken');
const User = require('../models/User');
 
// A diferencia de `protect` en authMiddleware.js, este middleware NO rechaza
// la petición si no hay token: el chat también debe funcionar para
// visitantes no registrados. Simplemente decide req.chatRole y req.chatUser.
const identifyChatUser = async (req, res, next) => {
  req.chatRole = 'guest';
  req.chatUser = null;
 
  const authHeader = req.headers.authorization;
 
  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
 
      if (user) {
        req.chatUser = user;
        req.chatRole = user.role === 'admin' ? 'admin' : 'user';
      }
    } catch (error) {
      // Token inválido, corrupto o expirado: no rompemos el chat,
      // simplemente lo tratamos como invitado.
      req.chatRole = 'guest';
      req.chatUser = null;
    }
  }
 
  next();
};
 
module.exports = { identifyChatUser };