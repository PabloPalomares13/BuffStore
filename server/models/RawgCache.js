const mongoose = require('mongoose');

const rawgCacheSchema = new mongoose.Schema({
  rawgId: { type: Number, required: true, unique: true },

  // --- Datos ya normalizados/traducidos por Gemini (lo que consume el form) ---
  name: String,
  slug: String,
  description: String,
  releaseDate: String,
  rating: Number,
  ratingsCount: Number,
  metacritic: { type: Number, default: null },
  genres: [String],       // traducidos, ej: ['Acción', 'Aventura']
  platforms: [String],    // texto libre, ej: ['PC', 'PlayStation 5', 'Xbox Series X|S']
  developer: String,
  publisher: String,
  tags: [String],         // traducidos, ej: ['Mundo abierto', 'Un jugador']
  esrbRating: { type: String, default: null },
  website: { type: String, default: null },
  images: {
    cover: String,
    screenshots: { type: [String], default: [] }
  },

  // true si Gemini normalizó bien la respuesta; false si se usó el fallback
  // (datos crudos de RAWG sin traducir) porque Gemini falló o devolvió algo inválido.
  normalizedByGemini: { type: Boolean, default: false },

  // Respuesta cruda de RAWG, para auditoría/depuración si algo sale mal.
  rawgRaw: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('RawgCache', rawgCacheSchema);