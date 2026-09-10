import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, ImageOff } from 'lucide-react';
import { getFavorites, toggleFavorite } from '../components/hooks/favorites';
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

  const handleAddToCart = (product) => {
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingIndex = currentCart.findIndex(item => item._id === product._id);
    if (existingIndex >= 0) currentCart[existingIndex].quantity += 1;
    else currentCart.push({ _id: product._id, name: product.name, price: product.price, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(currentCart));
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black px-4 py-20 sm:px-8 pt-32"
      style={{ fontFamily: '"Urbanist", sans-serif' }}>
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className="font-haze text-4xl text-white sm:text-5xl">Tus favoritos</h2>
          <p className="mt-4 font-Urbanist text-sm text-white/70 sm:text-base">
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((product) => {
              const hasImage = product.media?.find(m => m.type === 'image')?.url && !imgErrors.has(product._id);

              return (
                <div
                  key={product._id}
                  className="group relative overflow-hidden rounded-[20px] border border-white/20 bg-white/5 backdrop-blur-md p-4"
                >
                  {hasImage ? (
                    <img
                      src={product.media?.find(m => m.type === 'image')?.url}
                      alt={product.name}
                      onError={() => handleImgError(product._id)}
                      className="mb-3 h-40 w-full rounded-[14px] object-cover"
                    />
                  ) : (
                    <div className="relative mb-3 h-40 w-full overflow-hidden rounded-[14px] border border-white/10 bg-black">
                      {/* manchas de luz difuminadas, estilo ambiental */}
                      <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[#FF137A] opacity-40 blur-[40px]" />
                      <div className="pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-[#00FF37] opacity-40 blur-[40px]" />
                      {/* vidrio esmerilado sobre el fondo */}
                      <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-md rounded-[14px]">
                        <ImageOff size={26} className="text-white/30" />
                      </div>
                    </div>
                  )}

                  <h3 className="font-Urbanist text-base font-semibold text-white truncate">
                    {product.name}
                  </h3>
                  <p className="mt-1 font-Urbanist text-sm text-white/70">
                    ${Number(product.price).toLocaleString('en-US')} COP
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#00FF37]/40 bg-[#00FF37]/10 px-3 py-2 font-haze text-xs text-white shadow-[0_0_10px_rgba(0,255,55,0.3)] transition-colors hover:bg-[#00FF37]/20 hover:scale-105"
                    >
                      <ShoppingCart size={14} />
                      AGREGAR
                    </button>
                    <button
                      onClick={() => handleRemove(product)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 transition-colors hover:bg-white/20"
                      aria-label="Quitar de favoritos"
                    >
                      <Heart size={14} fill="white" />
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