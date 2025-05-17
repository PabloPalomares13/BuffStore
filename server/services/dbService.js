const mongoose = require('mongoose');
require('dotenv').config();

// Configuración para las conexiones a MongoDB
const connections = {
  // Conexión a MongoDB Atlas (principal)
  atlas: null,
  // Conexión a MongoDB Local (espejo)
  local: null
};

// Modelos para ambas conexiones
const models = {
  atlas: {},
  local: {}
};

// Inicializar conexiones a las bases de datos
const initializeConnections = async () => {
  try {
    // Intentar conectar primero a MongoDB Local
    try {
      connections.local = await mongoose.createConnection(process.env.MONGO_LOCAL_URI || 'mongodb://localhost:27017/buffstore-mirror');
      console.log('MongoDB Local connected');
    } catch (localError) {
      console.error('Error al conectar a MongoDB Local:', localError.message);
      console.log('Conexión local fallida, continuando solo con Atlas...');
    }

    // Conectar a MongoDB Atlas (siempre intentamos conectar a Atlas)
    connections.atlas = await mongoose.createConnection(process.env.MONGO_URI);
    console.log('MongoDB Atlas connected');

    // Inicializar modelos para las conexiones que estén disponibles
    initializeModels();

    return true;
  } catch (error) {
    console.error('Error al conectar a MongoDB Atlas:', error);
    
    // Si la conexión local existe pero Atlas falló, intentamos usar solo la local
    if (connections.local) {
      console.log('Continuando solo con la conexión local...');
      initializeModels();
      return true;
    }
    
    console.error('No se pudo establecer ninguna conexión a MongoDB');
    return false;
  }
};

// Inicializar modelos para ambas conexiones
const initializeModels = () => {
  // Importar esquemas (sin crear los modelos directamente)
  const { userSchema } = require('../models/schemas/UserSchema');
  
  // Crear modelos para MongoDB Atlas si la conexión existe
  if (connections.atlas) {
    models.atlas.User = connections.atlas.model('User', userSchema);
  }
  
  // Crear modelos para MongoDB Local si la conexión existe
  if (connections.local) {
    models.local.User = connections.local.model('User', userSchema);
  }
};

// Operaciones de sincronización para usuarios
const userOperations = {
  // Crear usuario en ambas bases de datos
  create: async (userData) => {
    try {
      let userAtlas = null;
      
      // Intentar crear en Atlas (principal) si está disponible
      if (connections.atlas) {
        try {
          userAtlas = await models.atlas.User.create(userData);
          console.log('Usuario creado en MongoDB Atlas');
        } catch (atlasError) {
          console.error('Error al crear usuario en MongoDB Atlas:', atlasError.message);
          // Si Atlas falla y no hay conexión local, propagar el error
          if (!connections.local) {
            throw atlasError;
          }
        }
      }
      
      // Intentar crear en Local (espejo) si está disponible
      if (connections.local) {
        try {
          const userLocal = await models.local.User.create(userData);
          console.log('Usuario creado en MongoDB Local');
          
          // Si no se pudo crear en Atlas pero sí en local, devolver el resultado local
          if (!userAtlas) {
            return userLocal;
          }
        } catch (localError) {
          console.error('Error al crear usuario en la base de datos local:', localError.message);
        }
      }
      
      // Si se creó en Atlas, devolver ese resultado
      if (userAtlas) {
        return userAtlas;
      }
      
      // Si llegamos aquí sin resultados, lanzar error
      throw new Error('No se pudo crear el usuario en ninguna base de datos');
    } catch (error) {
      console.error('Error en la operación de creación de usuario:', error);
      throw error; // Re-lanzar el error para que sea manejado por el controlador
    }
  },
  
  // Buscar usuario (prioridad en Atlas, fallback a Local)
  findOne: async (query) => {
    // Intentar primero en Atlas si está disponible
    if (connections.atlas) {
      try {
        const userAtlas = await models.atlas.User.findOne(query);
        if (userAtlas) return userAtlas;
      } catch (atlasError) {
        console.error('Error al buscar en MongoDB Atlas:', atlasError.message);
        // Continuar con Local como fallback
      }
    }
    
    // Si no se encuentra en Atlas o hay error, buscar en Local como fallback
    if (connections.local) {
      try {
        const userLocal = await models.local.User.findOne(query);
        return userLocal; // Podría ser null si tampoco existe en Local
      } catch (localError) {
        console.error('Error al buscar en base de datos local:', localError.message);
      }
    }
    
    // Si no hay conexiones disponibles o ambas fallaron
    if (!connections.atlas && !connections.local) {
      throw new Error('No hay conexiones de base de datos disponibles');
    }
    
    return null; // No se encontró el usuario en ninguna BD
  },
  
  // Buscar por ID (prioridad en Atlas, fallback a Local)
  findById: async (id, select = '') => {
    // Intentar primero en Atlas si está disponible
    if (connections.atlas) {
      try {
        const userAtlas = await models.atlas.User.findById(id).select(select);
        if (userAtlas) return userAtlas;
      } catch (atlasError) {
        console.error('Error al buscar por ID en MongoDB Atlas:', atlasError.message);
        // Continuar con Local como fallback
      }
    }
    
    // Si no se encuentra en Atlas o hay error, buscar en Local como fallback
    if (connections.local) {
      try {
        const userLocal = await models.local.User.findById(id).select(select);
        return userLocal; // Podría ser null si tampoco existe en Local
      } catch (localError) {
        console.error('Error al buscar por ID en base de datos local:', localError.message);
      }
    }
    
    // Si no hay conexiones disponibles o ambas fallaron
    if (!connections.atlas && !connections.local) {
      throw new Error('No hay conexiones de base de datos disponibles');
    }
    
    return null; // No se encontró el usuario en ninguna BD
  }
};

module.exports = {
  initializeConnections,
  connections,
  models,
  userOperations
};