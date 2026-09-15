const axios = require('axios');
require('dotenv').config();
 
// Necesitas una API key gratuita de https://rawg.io/apidocs
// Guárdala en server/.env como RAWG_API_KEY=xxxxx
const RAWG_API_KEY = process.env.RAWG_API_KEY;
 
const rawgClient = axios.create({
  baseURL: 'https://api.rawg.io/api',
  params: { key: RAWG_API_KEY }
});
 
module.exports = { rawgClient };