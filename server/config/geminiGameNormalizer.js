const { Type } = require('@google/genai');
const { ai, TEXT_MODELS, runWithFallback } = require('./geminiConfig');

// Esquema que Gemini está OBLIGADO a seguir (structured output). Esto reduce
// muchísimo el riesgo de JSON mal formado, pero igual lo revalidamos abajo
// antes de confiar en el resultado.
const gameSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    slug: { type: Type.STRING },
    description: { type: Type.STRING },
    releaseDate: { type: Type.STRING },
    rating: { type: Type.NUMBER },
    ratingsCount: { type: Type.NUMBER },
    metacritic: { type: Type.NUMBER, nullable: true },
    genres: { type: Type.ARRAY, items: { type: Type.STRING } },
    platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
    developer: { type: Type.STRING },
    publisher: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    esrbRating: { type: Type.STRING, nullable: true },
    website: { type: Type.STRING, nullable: true }
  },
  required: ['name', 'description', 'genres', 'platforms', 'tags']
};

const SYSTEM_INSTRUCTIONS = `Recibes datos crudos de la API de RAWG.io sobre un videojuego. Tu tarea:

1. Normaliza la estructura al esquema pedido (JSON schema forzado por la API).
2. Traduce al español los campos traducibles: géneros, tags, y la descripción.
3. NUNCA traduzcas nombres propios: nombres de juegos, estudios/desarrolladores,
   publishers ni nombres de plataformas (ej. "PlayStation 5" se queda igual, NO
   "PlayStation 5" -> "Estación de juego 5").
4. NUNCA inventes datos que no estén en el JSON de entrada. Si un campo no
   existe en los datos de RAWG, omítelo o usa null (según el tipo).
5. NO modifiques valores numéricos (rating, metacritic, ratingsCount) ni fechas:
   cópialos tal cual vienen.
6. "developer" y "publisher" son strings, no arrays: si RAWG trae varios, une
   los nombres con coma.
7. Responde ÚNICAMENTE el JSON del esquema. Sin texto antes ni después.`;

function buildPrompt(rawgGame) {
  return `${SYSTEM_INSTRUCTIONS}\n\nDatos crudos de RAWG:\n${JSON.stringify(rawgGame)}`;
}

// Validación manual del JSON que devuelve Gemini. No confiamos solo en que
// el responseSchema haya funcionado.
function validateGameSchema(data) {
  const errors = [];

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['la respuesta no es un objeto'] };
  }
  if (!data.name || typeof data.name !== 'string') errors.push('falta "name" (string)');
  if (!data.description || typeof data.description !== 'string') errors.push('falta "description" (string)');
  if (!Array.isArray(data.genres)) errors.push('"genres" debe ser un array');
  if (!Array.isArray(data.platforms)) errors.push('"platforms" debe ser un array');
  if (!Array.isArray(data.tags)) errors.push('"tags" debe ser un array');
  if (data.rating !== undefined && typeof data.rating !== 'number') errors.push('"rating" debe ser number');
  if (data.metacritic !== undefined && data.metacritic !== null && typeof data.metacritic !== 'number') {
    errors.push('"metacritic" debe ser number o null');
  }

  return { valid: errors.length === 0, errors };
}

// Intenta normalizar con Gemini.
// - Los errores temporales (503, 429...) los maneja runWithFallback:
//   reintenta con backoff y cambia de modelo si hace falta.
// - Si el JSON no cumple el esquema, se reintenta una vez más (attempt).
// Si sigue fallando, lanza el error para que el caller decida el fallback
// (nunca guardamos datos corruptos en Mongo).
async function normalizeGameData(rawgGame, attempt = 1) {
  const { result } = await runWithFallback(TEXT_MODELS, (model) =>
    ai.models.generateContent({
      model,
      contents: buildPrompt(rawgGame),
      config: {
        responseMimeType: 'application/json',
        responseSchema: gameSchema
      }
    })
  );

  let parsed;
  try {
    parsed = JSON.parse(result.text);
  } catch (error) {
    if (attempt < 2) return normalizeGameData(rawgGame, attempt + 1);
    throw new Error('Gemini devolvió un JSON inválido tras reintentar');
  }

  const validation = validateGameSchema(parsed);
  if (!validation.valid) {
    if (attempt < 2) return normalizeGameData(rawgGame, attempt + 1);
    throw new Error(`Respuesta de Gemini no cumple el esquema: ${validation.errors.join(', ')}`);
  }

  return parsed;
}

module.exports = { normalizeGameData, validateGameSchema };