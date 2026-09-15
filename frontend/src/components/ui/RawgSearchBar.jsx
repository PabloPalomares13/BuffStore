import { useState, useEffect, useRef } from 'react';
import rawgService from '../../services/rawgService';
 
/**
 * Barra de búsqueda de RAWG.io para autocompletar el formulario de producto.
 *
 * Uso en NewProduct.jsx / Modproducto.jsx:
 *
 *   <RawgSearchBar
 *     token={token}                 // el JWT del admin logeado
 *     onAutofill={(data) => {
 *       setFormData(prev => ({
 *         ...prev,
 *         name: data.name,
 *         description: data.description,
 *         category: data.genres[0] || prev.category,
 *         tags: data.tags,
 *         platforms: data.platforms,
 *       }));
 *     }}
 *   />
 *
 * El componente NUNCA guarda nada en la base de datos por sí solo:
 * solo entrega los datos vía onAutofill para que tú decidas cómo
 * mezclarlos con el formulario (y el admin los revise antes de guardar).
 */
export default function RawgSearchBar({ token, onAutofill }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
 
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
 
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
 
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');
        const data = await rawgService.searchGames(query.trim(), token);
        setResults(data.results || []);
        setOpen(true);
      } catch (err) {
        console.error('Error buscando en RAWG:', err);
        setError('No se pudo buscar en RAWG.io');
      } finally {
        setLoading(false);
      }
    }, 400);
 
    return () => clearTimeout(debounceRef.current);
  }, [query, token]);
 
  const handleSelect = async (rawgId) => {
    try {
      setLoading(true);
      setError('');
      const data = await rawgService.getGameDetails(rawgId, token);
      onAutofill(data.product);
      setOpen(false);
      setQuery(data.product.name);
    } catch (err) {
      console.error('Error obteniendo detalle de RAWG:', err);
      setError('No se pudo traer el detalle del juego');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Buscar en RAWG.io para autocompletar
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Ej: The Last of Us Part II"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
 
      {loading && (
        <p className="mt-1 text-xs text-gray-400">Buscando...</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
 
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-72 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((game) => (
            <li
              key={game.rawgId}
              onClick={() => handleSelect(game.rawgId)}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50"
            >
              {game.backgroundImage && (
                <img
                  src={game.backgroundImage}
                  alt={game.name}
                  className="h-10 w-16 rounded object-cover"
                />
              )}
              <div>
                <p className="text-sm font-medium text-gray-800">{game.name}</p>
                {game.released && (
                  <p className="text-xs text-gray-400">{game.released}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}