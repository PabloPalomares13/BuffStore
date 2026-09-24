import { Heart, ShoppingCart,Star } from 'lucide-react';
import logosimple from '../../assets/BLogo4K-white.png'; // ajusta la ruta si tu logo está en otro lugar
import { useState, useEffect } from 'react';
 import { getFavorites, toggleFavorite } from '../hooks/favorites';
import { useNavigate } from 'react-router-dom';
import StarRating from '../ui/StartRating';

/* ---------- Card individual ---------- */
 
function ProductCard({ product, index, handleAddToCart, handleProductClick,  isFavorite, onToggleFavorite}) {
  const tags = product.tags || product.category || [];
  
  return (
    <div
        onClick={() => handleProductClick(product._id)}
        className="group relative aspect-[3/4] w-full overflow-hidden rounded-[20px] border border-white/30 cursor-pointer transition-transform duration-300 ease-out hover:scale-[1.02]"
        >
      {/* Imagen de fondo, 50% opacidad, cubre toda la card */}
      <img
        src={product.displayImageUrl}
        alt={product.name}
        className="absolute inset-0 h-full w-full object-cover opacity-50 blur-[1px]" 
      />
 
      {/* Botones flotantes: favoritos y carrito */}
      <div className=" absolute top-6 right-6 z-20 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF137A]/80 shadow-[0_0_10px_rgba(255,19,122,0.6)] transition-transform hover:scale-105"
          aria-label="Añadir a favoritos"
        >
          <Heart size={18} className="text-white/80" fill={isFavorite ? "white" : "none"} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart(product);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00FF37]/80 shadow-[0_0_10px_rgba(0,255,55,0.6)] transition-transform hover:scale-105"
          aria-label="Añadir al carrito"
        >
          <ShoppingCart size={16} className="text-black" />
        </button>
      </div>
 
      {/* Imagen interna con margen y contenido */}
      
      <div className=" absolute inset-3 flex flex-col justify-end overflow-hidden rounded-[20px]">
        <img
          src={product.displayImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Panel inferior: el blur envuelve al contenido, así que crece con él.
           El mask-image desvanece SOLO el borde superior (no es un corte lineal recto). */}
        <div className="relative">
            <div
                className="absolute -top-20 inset-x-0 bottom-0 rounded-b-[20px] bg-black/50 backdrop-blur-[60px]"
                style={{
                maskImage:
                    'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0.9) 60%, black 100%)',
                WebkitMaskImage:
                    'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0.9) 60%, black 100%)',
                }}
            />
            
 
          {/* Contenido: título → calificación → tags → precio/botón */}
          <div className="relative z-10 flex flex-col gap-1.5 p-3">
            <h3 className=" text-2xl text-white leading-tight break-words">
              {product.name}
            </h3>
 
            {/* Calificación (placeholder mientras no tengas la variable real) */}
            <StarRating rating={product.rating} />
 
            {/* Tags: máximo 3, cada uno se trunca para que no se peguen entre sí */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="max-w-[45%] truncate rounded-full bg-white/15 backdrop-blur-sm px-2 py-0.5 text-[10px] font-Urbanist text-white/90"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
 
            {/* Precio a la izquierda, botón a la derecha, misma fila */}
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="flex flex-col leading-tight">
                <span className="font-Urbanist text-base font-bold text-white">
                  ${Number(product.price).toLocaleString('en-US')} COP
                </span>
                {product.originalPrice != null && (
                  <span className="font-Urbanist text-[11px] text-white/50 line-through">
                    ${Number(product.originalPrice).toLocaleString('en-US')} COP
                  </span>
                )}
              </div>
 
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product);
                }}
                className="shrink-0 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-1.5 font-haze text-xs tracking-wide text-white transition-colors hover:bg-white/20"
              >
                COMPRAR AHORA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 
/* ---------- Sección completa ---------- */
 
export default function CatalogSection({
  products = [],
  handleProductClick,
  onViewAll,
}) {
  const [showCartModal, setShowCartModal] = useState(false);
  const [addedProduct, setAddedProduct] = useState(null);
  const [favorites, setFavorites] = useState([]);
   const navigate = useNavigate();

    const handleAddToCart = (product) => {
        
        const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    
        const existingProductIndex = currentCart.findIndex(item => item._id === product._id);

        const productToAdd = {
            _id: product._id,
            name: product.name, 
            price: product.price, 
            quantity: 1
        };
    
        if (existingProductIndex >= 0) {
            currentCart[existingProductIndex].quantity += 1;
        } else { 
            currentCart.push(productToAdd);
        }
        localStorage.setItem('cart', JSON.stringify(currentCart));
        setAddedProduct(product);
        setShowCartModal(true);
    };
      const handleContinueShopping = () => {
        setShowCartModal(false); 
        setAddedProduct(null); 
      };
      const handleGoToCheckout = () => {
        window.location.href = '/checkout';
      };
    useEffect(() => {
      getFavorites().then(setFavorites);
    }, []);
    const handleToggleFavorite = async (product) => {
      const updated = await toggleFavorite(product, favorites);
      setFavorites(updated);
    };

  return (
    <section className="relative w-full  bg-transparent px-4 py-20 sm:px-8"
        style={{ fontFamily: '"Urbanist", sans-serif' }}>
      {/* Medias lunas de color, mirando en direcciones opuestas */}
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />
 
      {/* Logo central con transparencia y blur, detrás del contenido */}
      <img
        src={logosimple}
        alt=""
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-auto -translate-x-1/2 -translate-y-1/2 opacity-10 blur-sm"
      />
 
      {/* Contenido */}
      <div className="relative z-10 mx-auto px-4 ">
        {/* Título */}
        <div className="mb-10 text-center">
          <h2 className="font-haze text-4xl text-white sm:text-5xl">
            Nuestro catálogo
          </h2>
          <p className="mt-4 font-Urbanist text-sm text-white/70 sm:text-base">
            Códigos verificados, entrega automática y garantía de reembolso si tu clave falla.
          </p>
        </div>
 
        {/* Cuadrícula 4x2 responsive */}
        <div className="grid grid-cols-1 gap-5 mx-auto sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 ">
          {products.slice(0, 10).map((product, index) => (
            <ProductCard
              key={product._id || index}
              product={product}
              index={index}
              handleAddToCart={handleAddToCart}
              handleProductClick={handleProductClick}
              isFavorite={favorites.some(f => f._id === product._id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
 
        {/* Botón ver más */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => navigate('/productos')}
            className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-8 py-3 font-haze text-sm tracking-wide text-white transition-colors hover:bg-white/20"
          >
            VER TODOS
          </button>
        </div>
      </div>
      {showCartModal && addedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-sm px-4"
          onClick={handleContinueShopping}
        >
          <div
            className="relative w-full max-w-sm overflow-hidden rounded-[20px] border border-white/20 bg-black/50 backdrop-blur-xl p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[#00FF37] opacity-30 blur-[80px]" />
            <div className="pointer-events-none absolute -right-16 -bottom-16 h-40 w-40 rounded-full bg-[#FF137A] opacity-30 blur-[80px]" />

            <div className="relative z-10">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#00FF37]/40 bg-[#00FF37]/10 shadow-[0_0_20px_rgba(0,255,55,0.4)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#00FF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="font-haze text-2xl text-white">Agregado al carrito</h3>
              <p className="mt-2 font-Urbanist text-sm text-white/70">
                {addedProduct.name} se sumó a tu carrito correctamente.
              </p>

              <div className="mt-7 flex flex-col gap-3">
                <button
                  onClick={handleGoToCheckout}
                  className="rounded-full border border-[#FF137A]/50 bg-[#FF137A]/10 px-6 py-3 font-haze text-sm text-white shadow-[0_0_15px_rgba(255,19,122,0.35)] transition-colors hover:bg-[#FF137A]/20 hover:scale-105"
                >
                  PAGAR AHORA
                </button>
                <button
                  onClick={handleContinueShopping}
                  className="rounded-full border border-white/20 bg-white/10 px-6 py-3 font-Urbanist text-sm text-white/80 backdrop-blur-md transition-colors hover:bg-white/20 hover:scale-105"
                >
                  Seguir comprando
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}