const { rawgClient } = require('../config/rawgConfig');
const { normalizeGameData } = require('../config/geminiGameNormalizer');
const RawgCache = require('../models/RawgCache');
const Product = require('../models/Product');

// GET /api/rawg/search?name=...
// Solo lista candidatos (nombre + imagen + fecha), no gasta Gemini aquí.
exports.searchGames = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Falta el parámetro "name"' });
    }

    const existingProduct = await Product.findOne({ name: { $regex: name, $options: 'i' } })
      .select('name code')
      .lean();

    const cached = await RawgCache.find({ name: { $regex: name, $options: 'i' } })
      .limit(10)
      .lean();

    if (cached.length > 0) {
      return res.json({
        source: 'cache',
        alreadyInCatalog: !!existingProduct,
        results: cached.map(c => ({
          rawgId: c.rawgId,
          name: c.name,
          backgroundImage: c.images?.cover,
          released: c.releaseDate
        }))
      });
    }

    const { data } = await rawgClient.get('/games', {
      params: { search: name, page_size: 10 }
    });

    const results = (data.results || []).map(g => ({
      rawgId: g.id,
      name: g.name,
      backgroundImage: g.background_image,
      released: g.released
    }));

    if (results.length === 0) {
      return res.json({ source: 'rawg', alreadyInCatalog: !!existingProduct, results: [], message: 'No se encontraron juegos con ese nombre en RAWG.io' });
    }

    return res.json({ source: 'rawg', alreadyInCatalog: !!existingProduct, results });
  } catch (error) {
    return handleRawgError(res, error, 'buscar en RAWG.io');
  }
};

// GET /api/rawg/details/:rawgId
// Trae el detalle completo de RAWG, lo pasa por Gemini para normalizar/traducir,
// valida la respuesta, y cachea el resultado final. Si Gemini falla, hace
// fallback a los datos crudos de RAWG (sin traducir) en vez de romper el flujo.
exports.getGameDetails = async (req, res) => {
  const { rawgId } = req.params;

  try {
    if (!rawgId) return res.status(400).json({ error: 'Falta rawgId' });

    const existingCache = await RawgCache.findOne({ rawgId: Number(rawgId) }).lean();
    if (existingCache) {
      return res.json({ product: existingCache });
    }

    // 1. RAWG es la fuente de verdad de los datos factuales.
    let rawgGame;
    try {
      const detailResp = await rawgClient.get(`/games/${rawgId}`);
      rawgGame = detailResp.data;
    } catch (error) {
      return handleRawgError(res, error, 'obtener el detalle del juego en RAWG.io');
    }

    if (!rawgGame || !rawgGame.name) {
      return res.status(404).json({ error: 'Juego no encontrado en RAWG.io' });
    }

    // Screenshots vienen en un endpoint aparte.
    let screenshots = [];
    try {
      const shotsResp = await rawgClient.get(`/games/${rawgId}/screenshots`);
      screenshots = (shotsResp.data.results || []).slice(0, 6).map(s => s.image);
    } catch (error) {
      console.warn('No se pudieron traer screenshots de RAWG:', error.message);
      // no es crítico, seguimos sin screenshots
    }

    // Armamos un objeto "crudo pero ya aplanado" para mandarle a Gemini,
    // sin todavía traducir ni tocar la estructura final.
    const rawForGemini = {
      id: rawgGame.id,
      name: rawgGame.name,
      slug: rawgGame.slug,
      released: rawgGame.released,
      description_raw: rawgGame.description_raw,
      rating: rawgGame.rating,
      ratings_count: rawgGame.ratings_count,
      metacritic: rawgGame.metacritic,
      genres: (rawgGame.genres || []).map(g => g.name),
      platforms: (rawgGame.platforms || []).map(p => p.platform?.name).filter(Boolean),
      developers: (rawgGame.developers || []).map(d => d.name),
      publishers: (rawgGame.publishers || []).map(p => p.name),
      tags: (rawgGame.tags || []).slice(0, 15).map(t => t.name),
      esrb_rating: rawgGame.esrb_rating?.name || null,
      website: rawgGame.website || null
    };

    // Datos que RAWG entrega y que NUNCA deben pasar por el "criterio" de
    // Gemini (imágenes, IDs) — se anexan tal cual al final.
    const untouchedFromRawg = {
      rawgId: rawgGame.id,
      images: {
        cover: rawgGame.background_image || null,
        screenshots
      }
    };

    // 2. Gemini normaliza y traduce. Si falla dos veces, caemos a un fallback
    //    con los datos crudos de RAWG (sin traducir) en vez de romper el flujo
    //    o guardar basura en Mongo.
    let normalized;
    let normalizedByGemini = true;

    try {
      normalized = await normalizeGameData(rawForGemini);
    } catch (error) {
      console.error('Gemini no pudo normalizar los datos de RAWG, usando fallback crudo:', error.message);
      normalizedByGemini = false;
      normalized = {
        name: rawForGemini.name,
        slug: rawForGemini.slug,
        description: rawForGemini.description_raw ? rawForGemini.description_raw.slice(0, 2000) : '',
        releaseDate: rawForGemini.released,
        rating: rawForGemini.rating,
        ratingsCount: rawForGemini.ratings_count,
        metacritic: rawForGemini.metacritic ?? null,
        genres: rawForGemini.genres,       // sin traducir
        platforms: rawForGemini.platforms, // texto libre, sin traducir (ya está en inglés/nombre oficial)
        developer: rawForGemini.developers.join(', '),
        publisher: rawForGemini.publishers.join(', '),
        tags: rawForGemini.tags,           // sin traducir
        esrbRating: rawForGemini.esrb_rating,
        website: rawForGemini.website
      };
    }

    const finalDoc = {
      ...untouchedFromRawg,
      ...normalized,
      normalizedByGemini,
      rawgRaw: rawgGame
    };

    const created = await RawgCache.create(finalDoc);

    return res.json({ product: created.toObject(), normalizedByGemini });
  } catch (error) {
    console.error('Error en getGameDetails:', error);
    return res.status(500).json({ error: 'Error al obtener el detalle del juego', details: error.message });
  }
};

// Centraliza el manejo de errores de RAWG (no encontrado, rate limit, caído).
function handleRawgError(res, error, actionDescription) {
  console.error(`Error al ${actionDescription}:`, error.message);

  const status = error.response?.status;

  if (status === 404) {
    return res.status(404).json({ error: 'Juego no encontrado en RAWG.io' });
  }
  if (status === 429) {
    return res.status(429).json({ error: 'Se alcanzó el límite de peticiones a RAWG.io, intenta más tarde' });
  }
  if (status === 401 || status === 403) {
    return res.status(502).json({ error: 'RAWG.io rechazó la petición (API key inválida o sin permisos)' });
  }
  if (!error.response) {
    return res.status(502).json({ error: 'No se pudo conectar con RAWG.io, intenta más tarde' });
  }

  return res.status(500).json({ error: `Error inesperado al ${actionDescription}` });
}