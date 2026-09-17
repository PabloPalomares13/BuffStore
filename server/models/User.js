const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
 
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: String,
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
 
  // ============ DATOS DE PERFIL (nuevos) ============
  fullName: {
    type: String,
    default: '',
    trim: true,
  },
  nickname: {
    type: String,
    default: '',
    trim: true,
    // permite null/"" sin romper el índice único
    unique: true,
    sparse: true,
  },
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  birthDate: {
    type: Date,
    default: null,
  },
  // Dirección de facturación electrónica (ej: correo/CUFE para factura digital)
  billingAddress: {
    type: String,
    default: '',
    trim: true,
  },
  avatarUrl: {
    type: String,
    default: '', // si está vacío, el frontend usa el avatar por defecto
  },
  // ============ FIN DATOS DE PERFIL ============
 
}, {
  timestamps: true,
});
 
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
 
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
 
// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
 
// Nunca devolver el hash de la contraseña al serializar el usuario
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};
 
const User = mongoose.model('User', userSchema);
 
module.exports = User;
