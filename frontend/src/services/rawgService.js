import axios from 'axios';
 
const API_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:3000/api';
 
const rawgService = {
  // Busca candidatos por nombre. token = JWT del admin logeado.
  searchGames: async (name, token) => {
    const response = await axios.get(`${API_URL}/rawg/search`, {
      params: { name },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data; // { source, alreadyInCatalog, results: [...] }
  },
 
  // Trae el detalle completo de un juego para autocompletar el formulario.
  getGameDetails: async (rawgId, token) => {
    const response = await axios.get(`${API_URL}/rawg/details/${rawgId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data; // { product: {...} }
  }
};
 
export default rawgService;