const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const storeInfo = {
    name: "BuffStore",
    description: "Tienda especializada en venta de codigo de videojuegos y microtransacciones digitales dentro de los videojuegos",
    products: "Vendemos videojuegos digitales para todas las plataformas y consolas de videojuegos",
    shipping: "Envíos a todo el mundo, de manera instantanea en menos de 5 minutos a tu correo",
    returns: "Política de devoluciones de 14 días",
    contact: "soporte@buffstore.com",
};

const getTextModel = () => {
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash"});
};

const getVisionModel = () => {
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash"});
};

const generateSystemPrompt = () => {
    return `Eres un asistente virtual para la tienda de videojuegos BuffStore. 
    
    Sobre BuffStore:
    - ${storeInfo.name}: ${storeInfo.description}
    - Productos: ${storeInfo.products}
    - Envíos: ${storeInfo.shipping}
    - Devoluciones: ${storeInfo.returns}
    - Contacto: ${storeInfo.contact}
    
    Tu objetivo es ayudar a los clientes con información sobre productos, política de envíos, devoluciones y otras preguntas relacionadas con la tienda.
    
    Para preguntas sobre juegos específicos, proporciona información general y recomienda que visiten la ficha del producto para más detalles.
    
    Si te piden identificar un juego a partir de una imagen, analiza la carátula y proporciona:
    1. Nombre del juego
    2. Plataforma (busca en internet en que plataformas esta o estara disponible si no lo encuentras)
    3. Género
    4. Breve descripción de 2-3 frases
    5. Año de lanzamiento (busca en internet si no lo encuentras)
    
    Sé amable, informativo y conciso en tus respuestas.`;
  };
  
  module.exports = {
    getTextModel,
    getVisionModel,
    generateSystemPrompt,
    storeInfo
  };