const link = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000';

const isLoggedIn = () => !!localStorage.getItem('userToken');

// Filtra entradas nulas o sin _id (por ejemplo, favoritos de productos ya eliminados
// que hayan quedado guardados en localStorage de una sesión de invitado)
const cleanList = (list) => (Array.isArray(list) ? list.filter((f) => f && f._id) : []);

export async function getFavorites() {
  if (isLoggedIn()) {
    const res = await fetch(`${link}/api/favoritos`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` },
    });
    return res.ok ? cleanList(await res.json()) : [];
  }
  return cleanList(JSON.parse(localStorage.getItem('favorites')));
}

export async function toggleFavorite(product, currentFavorites) {
  const safeFavorites = cleanList(currentFavorites);
  const exists = safeFavorites.some(f => f._id === product._id);

  if (isLoggedIn()) {
    if (exists) {
      await fetch(`${link}/api/favoritos/${product._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` },
      });
    } else {
      await fetch(`${link}/api/favoritos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('userToken')}`,
        },
        body: JSON.stringify({ productId: product._id }),
      });
    }
    return exists
      ? safeFavorites.filter(f => f._id !== product._id)
      : [...safeFavorites, product];
  }

  // Invitado: solo localStorage
  const updated = exists
    ? safeFavorites.filter(f => f._id !== product._id)
    : [...safeFavorites, product];
  localStorage.setItem('favorites', JSON.stringify(updated));
  return updated;
}

// Llamar justo después de un login exitoso
export async function mergeFavoritesOnLogin() {
  const localFavorites = cleanList(JSON.parse(localStorage.getItem('favorites')));
  const localIds = localFavorites.map(f => f._id);

  const res = await fetch(`${link}/api/favoritos/merge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('userToken')}`,
    },
    body: JSON.stringify({ productIds: localIds }),
  });

  const merged = res.ok ? cleanList(await res.json()) : localFavorites;
  localStorage.removeItem('favorites'); // ya vive en el backend
  return merged;
}