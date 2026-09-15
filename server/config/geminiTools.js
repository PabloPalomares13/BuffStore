const { Type } = require('@google/genai');
 
// --- Declaraciones individuales ---
 
const getProductsDeclaration = {
  name: 'getProducts',
  description: 'Busca y lista productos de la tienda (videojuegos, monedas virtuales, suscripciones): precio, stock, tags, categoría, plataformas y descripción.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      search: { type: Type.STRING, description: 'Texto de búsqueda: nombre, tag o categoría. Opcional, si se omite trae productos generales.' },
      limit: { type: Type.NUMBER, description: 'Cantidad máxima de resultados (default 10, máximo 20).' }
    }
  }
};
 
const createProductDeclaration = {
  name: 'createProduct',
  description: 'Crea un nuevo producto en la tienda. Solo para administradores.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      description: { type: Type.STRING },
      price: { type: Type.NUMBER },
      stock: { type: Type.NUMBER },
      category: { type: Type.STRING },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      platforms: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['name', 'price']
  }
};
 
const updateProductDeclaration = {
  name: 'updateProduct',
  description: 'Actualiza campos de un producto existente, dado su ID de Mongo. Solo para administradores. Si no tienes el ID, usa primero getProducts para encontrarlo.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      productId: { type: Type.STRING, description: 'ID de Mongo del producto a actualizar.' },
      updates: {
        type: Type.OBJECT,
        description: 'Campos a modificar.',
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          price: { type: Type.NUMBER },
          stock: { type: Type.NUMBER },
          category: { type: Type.STRING },
          featured: { type: Type.BOOLEAN }
        }
      }
    },
    required: ['productId', 'updates']
  }
};
 
const deleteProductDeclaration = {
  name: 'deleteProduct',
  description: 'Elimina un producto por su ID de Mongo. Solo para administradores. Si el pedido del admin fue ambiguo (no dio un ID claro), primero confirma con él usando texto antes de llamar a esta función.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      productId: { type: Type.STRING }
    },
    required: ['productId']
  }
};
 
const getOrdersDeclaration = {
  name: 'getOrders',
  description: 'Consulta órdenes/compras de la tienda. Solo para administradores.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      status: { type: Type.STRING, description: 'Filtra por estado: pending, paid, shipped, delivered, cancelled.' },
      limit: { type: Type.NUMBER }
    }
  }
};
 
const getUsersDeclaration = {
  name: 'getUsers',
  description: 'Lista usuarios registrados (solo email, rol y fecha de registro; nunca contraseñas). Solo para administradores.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      role: { type: Type.STRING, description: 'Filtra por rol: admin o user.' },
      limit: { type: Type.NUMBER }
    }
  }
};
 
const getMyOrdersDeclaration = {
  name: 'getMyOrders',
  description: 'Consulta el historial de compras del usuario que está hablando en el chat AHORA MISMO. Nunca de otros usuarios.',
  parameters: { type: Type.OBJECT, properties: {} }
};
 
const getMyFavoritesDeclaration = {
  name: 'getMyFavorites',
  description: 'Consulta los productos favoritos del usuario que está hablando en el chat, para poder recomendarle cosas.',
  parameters: { type: Type.OBJECT, properties: {} }
};
 
const createReportDeclaration = {
  name: 'createReport',
  description: 'Crea un reporte (queja, reclamo, sugerencia o reporte de falla) cuando el usuario lo pide EXPLÍCITAMENTE. Requiere que el usuario esté registrado. No la uses de forma implícita solo porque el usuario mencionó un problema de pasada.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, description: 'Uno de: queja, reclamo, sugerencia, falla_producto, falla_sitio.' },
      message: { type: Type.STRING, description: 'Descripción del reporte, en palabras del usuario.' },
      relatedProductId: { type: Type.STRING, description: 'ID del producto relacionado, si el usuario lo mencionó.' }
    },
    required: ['type', 'message']
  }
};
 
// --- Sets de tools por rol ---
 
const TOOLS_BY_ROLE = {
  admin: [{
    functionDeclarations: [
      getProductsDeclaration,
      createProductDeclaration,
      updateProductDeclaration,
      deleteProductDeclaration,
      getOrdersDeclaration,
      getUsersDeclaration
    ]
  }],
  user: [{
    functionDeclarations: [
      getProductsDeclaration,
      getMyOrdersDeclaration,
      getMyFavoritesDeclaration,
      createReportDeclaration
    ]
  }],
  guest: [{
    functionDeclarations: [getProductsDeclaration]
  }]
};
 
module.exports = { TOOLS_BY_ROLE };