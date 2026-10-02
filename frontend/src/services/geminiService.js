import axios from 'axios';

const API_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('userToken'); // ← misma key que usa Login.jsx
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const geminiService = {
  sendTextMessage: async (message) => {
    try {
      const response = await axios.post(
        `${API_URL}/gemini/text`,
        { message },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje a Gemini:', error);
      throw error;
    }
  },

  sendImageForAnalysis: async (imageData) => {
    try {
      const response = await axios.post(
        `${API_URL}/gemini/image`,
        { image: imageData },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error al analizar imagen:', error);
      throw error;
    }
  }
};

export default geminiService;