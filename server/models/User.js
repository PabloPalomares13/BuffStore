const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

    typeID: String,
    personalID: String,
    email: String,
    password: String
},{
    timestamps: true
  });

  userSchema.pre('save', async function(next) {
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
  userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };
  
  const User = mongoose.model('User', userSchema);
  

module.exports = User;

// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({

//     typeID: String,
//     personalID: String,
//     email: String,
//     password: String
// },{
//     timestamps: true
//   });

//   userSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) return next();
    
//     try {
//       const salt = await bcrypt.genSalt(10);
//       this.password = await bcrypt.hash(this.password, salt);
//       next();
//     } catch (error) {
//       next(error);
//     }
//   });

// // Método para comparar contraseñas
//   userSchema.methods.comparePassword = async function(candidatePassword) {
//     return await bcrypt.compare(candidatePassword, this.password);
//   };
  
//   const User = mongoose.model('User', userSchema);
  

// module.exports = User;