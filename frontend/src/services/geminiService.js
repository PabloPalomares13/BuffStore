import axios from 'axios';

//const API_URL = import.meta.env.VITE_API_URL || '/api';

const API_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:3000/api'


// Servicio para gestionar las interacciones con la API de Gemini
const geminiService = {
  // Enviar mensaje de texto a la API de Gemini
  sendTextMessage: async (message) => {
    try {
      console.log('Enviando mensaje a:', `${API_URL}/gemini/text`);
      const response = await axios.post(`${API_URL}/gemini/text`, { message });
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje a Gemini:', error);
      console.error('Respuesta de error:', error.response?.data || 'Sin datos de respuesta');
      throw error;
    }
  },
  
  
  // Enviar imagen para análisis con la API de Gemini
  sendImageForAnalysis: async (imageData) => {
    try {
      const response = await axios.post(`${API_URL}/gemini/image`, {
        image: imageData
      });
      return response.data;
    } catch (error) {
      console.error('Error al enviar imagen a Gemini:', error);
      throw error;
    }
  }
};

export default geminiService;