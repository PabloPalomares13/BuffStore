import { useState, useEffect, useRef } from 'react';
import rawgService from '../../services/rawgService';

// Props:
//  - token: JWT del admin
//  - onAutofill(product): rellena el formulario con los datos del juego
//  - onCacheCleared(): (opcional) para que NewProduct reinicie el formulario
export default function RawgSearchBar({ token, onAutofill, onCacheCleared }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);       // buscando candidatos
  const [loadingDetails, setLoadingDetails] = useState(false); // trayendo el detalle (RAWG + Gemini)
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null); // rawgId del juego en el que trabajo

  const debounceRef = useRef(null);
  const skipNextSearch = useRef(false);
  const selectingRef = useRef(false);   // bloqueo síncrono contra doble clic
  const searchIdRef = useRef(0);        // descarta respuestas de búsquedas viejas

  // Mientras se busca o se carga un detalle, no se puede elegir otro juego
  const busy = searching || loadingDetails;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Al seleccionar un juego se pone su nombre en el input; no hace falta volver a buscar.
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    if (!query || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const myId = ++searchIdRef.current;
      try {
        setSearching(true);
        setError('');
        const data = await rawgService.searchGames(query.trim(), token);
        if (myId !== searchIdRef.current) return; // llegó una búsqueda más nueva
        setResults(data.results || []);
        setOpen(true);
      } catch (err) {
        if (myId !== searchIdRef.current) return;
        console.error('Error buscando en RAWG:', err);
        setError('No se pudo buscar en RAWG.io');
      } finally {
        if (myId === searchIdRef.current) setSearching(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query, token]);

  const handleSelect = async (rawgId) => {
    // Bloqueos: búsqueda en curso, detalle en curso o doble clic
    if (busy || selectingRef.current) return;
    selectingRef.current = true;

    try {
      setLoadingDetails(true);
      setError('');
      setInfo('');
      setOpen(false); // cierra la lista de inmediato para que no se pueda volver a pulsar

      const data = await rawgService.getGameDetails(rawgId, token);
      onAutofill(data.product);
      setSelectedId(rawgId);
      skipNextSearch.current = true;
      setQuery(data.product.name);
      console.log('Autocompletado:', data.product);
    } catch (err) {
      console.error('Error obteniendo detalle de RAWG:', err);
      setError('No se pudo traer el detalle del juego');
    } finally {
      setLoadingDetails(false);
      selectingRef.current = false;
    }
  };

  // Borra de la BD la caché SOLO del juego seleccionado y deja el buscador limpio
  const handleClearCache = async () => {
    if (!selectedId || busy) return;

    const ok = window.confirm(
      'Se borrará de la caché solo este juego. La próxima vez que lo selecciones se volverá a consultar RAWG y Gemini. ¿Continuar?'
    );
    if (!ok) return;

    try {
      setClearing(true);
      setError('');
      setInfo('');
      await rawgService.clearGameCache(selectedId, token);

      searchIdRef.current++; // invalida cualquier búsqueda pendiente
      setSelectedId(null);
      skipNextSearch.current = true;
      setQuery('');
      setResults([]);
      setOpen(false);
      if (onCacheCleared) onCacheCleared();

      setInfo('Caché eliminada. Vuelve a buscar y seleccionar el juego para normalizarlo de nuevo.');
    } catch (err) {
      console.error('Error limpiando la caché:', err);
      setError('No se pudo limpiar la caché del juego');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="relative w-full ">
      <label className="block text-lg font-semibold mb-3 text-white">
        Buscar en RAWG.io para autocompletar
      </label>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          disabled={loadingDetails}
          placeholder="Nombre del Videojuego"
          className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors disabled:opacity-60"
        />

        {selectedId && (
          <button
            type="button"
            onClick={handleClearCache}
            disabled={clearing || busy}
            className="shrink-0 px-4 py-2 rounded-full border border-red-500/50 text-red-400 text-sm hover:bg-red-500/10 disabled:opacity-50 transition-colors"
          >
            {clearing ? 'Limpiando...' : 'Limpiar caché'}
          </button>
        )}
      </div>

      {searching && <p className="mt-1 text-xs text-white">Buscando...</p>}
      {loadingDetails && (
        <p className="mt-1 text-xs text-white">Cargando datos del juego, esto puede tardar unos segundos...</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {info && <p className="mt-1 text-xs text-[#00FF37]">{info}</p>}

      {open && results.length > 0 && (
        <ul
          aria-busy={busy}
          className={`absolute z-50 my-1 w-full max-h-72 overflow-auto rounded-lg border border-white/20 bg-[#232323] shadow-lg overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            busy ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          {results.map((game) => (
            <li
              key={game.rawgId}
              onClick={() => handleSelect(game.rawgId)}
              className={`flex items-center gap-3 px-3 py-2 ${
                busy ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-black/40'
              }`}
            >
              {game.backgroundImage && (
                <img
                  src={game.backgroundImage}
                  alt={game.name}
                  className="h-10 w-16 rounded object-cover"
                />
              )}
              <div>
                <p className="text-sm font-medium text-white">{game.name}</p>
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