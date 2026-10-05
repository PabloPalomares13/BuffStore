import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, ImageOff } from 'lucide-react';
import { getFavorites, toggleFavorite } from '../components/hooks/favorites';
 
// Prioridad: 1) poster, 2) cualquier otra imagen, 3) thumbnail de un video.
// Devuelve null si no hay nada que mostrar.
const getProductImage = (product) => {
  const media = Array.isArray(product?.media) ? product.media : [];
 
  const poster = media.find((m) => m.isPoster && m.url);
  if (poster) return poster.url;
 
  const image = media.find((m) => m.type === 'image' && m.url);
  if (image) return image.url;
 
  const videoThumb = media.find((m) => m.type === 'video' && m.thumbnail);
  return videoThumb ? videoThumb.thumbnail : null;
};
 
export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [imgErrors, setImgErrors] = useState(new Set());
 
  useEffect(() => {
    getFavorites().then(setFavorites);
  }, []);
 
  const handleRemove = async (product) => {
    const updated = await toggleFavorite(product, favorites);
    setFavorites(updated);
  };
 
  const handleImgError = (id) => {
    setImgErrors((prev) => new Set(prev).add(id));
  };
 
  const handleAddToCart = (product) => {
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingIndex = currentCart.findIndex((item) => item._id === product._id);
    if (existingIndex >= 0) currentCart[existingIndex].quantity += 1;
    else
      currentCart.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    localStorage.setItem('cart', JSON.stringify(currentCart));
  };
 
  return (
    <section
      className="relative min-h-screen w-full overflow-hidden bg-black px-4 py-20 sm:px-8 pt-32"
      style={{ fontFamily: '"Urbanist", sans-serif' }}
    >
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />
 
      {/* Contenedor: crece en pantallas grandes */}
      <div className="relative z-10 mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[96rem]">
        <div className="mb-10 text-center">
          <h2 className="font-haze text-4xl text-white sm:text-5xl xl:text-6xl">
            Tus favoritos
          </h2>
          <p className="mt-4 font-Urbanist text-sm text-white/70 sm:text-base xl:text-lg">
            Los productos que has guardado para más tarde.
          </p>
        </div>
 
        {favorites.length === 0 ? (
          <div className="mx-auto max-w-md rounded-[20px] border border-white/20 bg-white/5 backdrop-blur-md p-10 text-center">
            <Heart size={32} className="mx-auto mb-4 text-white/40" />
            <p className="font-Urbanist text-sm text-white/60">
              Aún no has agregado nada a favoritos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-7 2xl:gap-8">
            {favorites.map((product) => {
              const imageUrl = getProductImage(product);
              const hasImage = !!imageUrl && !imgErrors.has(product._id);
 
              return (
                <div
                  key={product._id}
                  className="group relative overflow-hidden rounded-[20px] border border-white/20 bg-white/5 backdrop-blur-md p-4 xl:p-5 2xl:p-3 "
                >
                  {hasImage ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      loading="lazy"
                      onError={() => handleImgError(product._id)}
                      className="mb-3 aspect-[4/3] w-full rounded-[14px] object-cover xl:mb-6"
                    />
                  ) : (
                    <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-[14px] border border-white/10 bg-black xl:mb-4">
                      {/* manchas de luz difuminadas, estilo ambiental */}
                      <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[#FF137A] opacity-40 blur-[40px]" />
                      <div className="pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-[#00FF37] opacity-40 blur-[40px]" />
                      {/* vidrio esmerilado sobre el fondo */}
                      <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-md rounded-[14px]">
                        <ImageOff className="h-7 w-7 text-white/30 xl:h-9 xl:w-9" />
                      </div>
                    </div>
                  )}
 
                  <h3 className="font-Urbanist text-base font-semibold text-white truncate xl:text-lg 2xl:text-xl pl-2">
                    {product.name}
                  </h3>
                  <p className="mt-1 font-Urbanist text-sm text-white/70 xl:text-base pl-2">
                    ${Number(product.price).toLocaleString('en-US')} COP
                  </p>
 
                  <div className="mt-4 flex items-center gap-2 xl:mt-5 xl:gap-3">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#00FF37]/40 bg-[#00FF37]/10 px-3 py-2 xl:py-2.5 font-haze text-xs xl:text-sm text-white shadow-[0_0_10px_rgba(0,255,55,0.3)] transition-colors hover:bg-[#00FF37]/20 hover:scale-105"
                    >
                      <ShoppingCart className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
                      AGREGAR
                    </button>
                    <button
                      onClick={() => handleRemove(product)}
                      className="flex h-9 w-9 xl:h-11 xl:w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 transition-colors hover:bg-white/20"
                      aria-label="Quitar de favoritos"
                    >
                      <Heart className="h-3.5 w-3.5 xl:h-4 xl:w-4" fill="white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}