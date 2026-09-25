import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2,X,CheckCircle,Video,  ShoppingCart, Plus, Minus } from 'lucide-react';
import ReviewsSection from '../components/ReviewsSection';
import StartRating from '../components/ui/StartRating';
const ProductDetail = () => {
  const { id } = useParams(); // Obtener el ID del producto desde la URL
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Volumen inicial del video del visor principal (0 a 1). El usuario puede
  // subirlo o bajarlo después con el control nativo del reproductor.
  const INITIAL_VIDEO_VOLUME = 0.2;

  const link = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  // Función para obtener datos del producto desde tu base de datos
  const fetchProductData = async () => {
    try {
      const response = await fetch(`${link}/api/products/${id}`);
      if (!response.ok) {
        throw new Error('Producto no encontrado');
      }
      const data = await response.json();
      setProduct(data);
      return data;
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Trae otros productos de la tienda para la sección "También te puede interesar".
  // Usa el mismo endpoint de listado que el resto de la app (GET /api/products),
  // y filtra/mezcla en el frontend para no depender de query params específicos del backend.
  const fetchRelatedProducts = async (currentProduct) => {
    if (!currentProduct) return;
    try {
      setLoadingRelated(true);
      const response = await fetch(`${link}/api/products`);
      if (!response.ok) throw new Error('No se pudieron cargar productos relacionados');
      const data = await response.json();

      // El listado puede venir como array directo o como { products: [...] }
      const allProducts = Array.isArray(data) ? data : (data.products || []);

      // Excluye el producto actual
      const others = allProducts.filter((p) => p._id !== currentProduct._id);

      // Prioriza la misma categoría; si no alcanzan 4, completa con el resto
      const sameCategory = others.filter((p) => p.category === currentProduct.category);
      const rest = others.filter((p) => p.category !== currentProduct.category);

      // Mezcla cada grupo para no mostrar siempre los mismos
      const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

      const picked = [...shuffle(sameCategory), ...shuffle(rest)].slice(0, 4);
      setRelatedProducts(picked);
    } catch (err) {
      console.error('Error cargando productos relacionados:', err);
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  };

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const loadData = async () => {
      setLoading(true);
      setSelectedMediaIndex(0); // reinicia el carrusel al entrar a otro producto
      const data = await fetchProductData();
      await fetchRelatedProducts(data);
      setLoading(false);
    };

    loadData();
  }, [id]);

  // Orden fijo de la galería: 1) poster/cover, 2) video(s), 3) resto de imágenes.
  // El carrusel automático y las miniaturas usan este orden, no el de la BD.
  const orderedMedia = useMemo(() => {
    if (!product?.media || product.media.length === 0) return [];

    const poster = product.media.find((m) => m.isPoster);
    const videos = product.media.filter((m) => m.type === 'video' && !m.isPoster);
    const images = product.media.filter((m) => m.type === 'image' && !m.isPoster);

    return [...(poster ? [poster] : []), ...videos, ...images];
  }, [product]);

  // Función para agregar al carrito
  const handleAddToCart = () => {
    if (!product) return;

    const cartItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: orderedMedia[0]?.url || product.images?.[0] || ''
    };

    // Obtener carrito actual
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Verificar si el producto ya está en el carrito
    const existingItemIndex = currentCart.findIndex(item => item._id === product._id);
    
    if (existingItemIndex > -1) {
      // Actualizar cantidad
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      // Agregar nuevo item
      currentCart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(currentCart));
    setShowModal(true);
  };

  const increaseQty = () => {
    if (quantity < Math.min(product?.stock || 0, 10)) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };  

  const nextMedia = () => {
    if (orderedMedia.length === 0) return;
    const newIndex = (selectedMediaIndex + 1) % orderedMedia.length;
    setSelectedMediaIndex(newIndex);
    if (previewMedia) { // Actualiza el modal si está abierto
      const media = orderedMedia[newIndex];
      setPreviewMedia({ type: media.type, url: media.url, thumbnail: media.thumbnail });
    }
  };

  const prevMedia = () => {
    if (orderedMedia.length > 0) {
      const newIndex = selectedMediaIndex === 0 ? orderedMedia.length - 1 : selectedMediaIndex - 1;
      setSelectedMediaIndex(newIndex);
      if (previewMedia) {
        const media = orderedMedia[newIndex];
        setPreviewMedia({ type: media.type, url: media.url, thumbnail: media.thumbnail });
      }
    }
  };

  // Carrusel automático: portada 5s, imágenes 10s, video hasta que termine (evento onEnded).
  // Se pausa mientras el modal de pantalla completa está abierto, y se reinicia
  // cada vez que el usuario navega manualmente (con flechas o miniaturas).
  useEffect(() => {
    if (orderedMedia.length <= 1 || previewMedia) return undefined;

    const current = orderedMedia[selectedMediaIndex];
    if (!current || current.type === 'video') return undefined; // el video avanza solo al terminar

    const duration = current.isPoster ? 5000 : 10000;
    const timer = setTimeout(() => {
      setSelectedMediaIndex((prev) => (prev + 1) % orderedMedia.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [selectedMediaIndex, orderedMedia, previewMedia]);
  // Renderizar galería de imágenes
  const renderMedia = () => {
    if (orderedMedia.length === 0) {
      return (
        <div className="w-full h-96 bg-white/5 border border-white/20 rounded-[20px] flex items-center justify-center">
          <p className="text-gray-400">Sin imagen disponible</p>
        </div>
      );
    }

    const currentMedia = orderedMedia[selectedMediaIndex];

    if (currentMedia.type === 'video') {
      return (
        <video
          key={currentMedia.url}
          autoPlay
          // Empieza silenciado porque los navegadores bloquean el autoplay con sonido;
          // en cuanto arranca (onPlay) se desmutea al volumen inicial.
          muted
          // Si es el único elemento de la galería se repite; si hay más, al terminar avanza al siguiente
          loop={orderedMedia.length === 1}
          playsInline
          controls
          onEnded={orderedMedia.length > 1 ? nextMedia : undefined}
          onPlay={(e) => {
            e.target.muted = false;
            e.target.volume = INITIAL_VIDEO_VOLUME;
          }}
          onClick={() => setPreviewMedia({ type: 'video', url: currentMedia.url, thumbnail: currentMedia.thumbnail })}
          className="w-full h-106 rounded-[20px] object-cover"
          poster={currentMedia.thumbnail}
        >
          <source src={currentMedia.url} type="video/mp4" />
          Tu navegador no soporta videos.
        </video>
      );
    }

    return (
      <img
        src={currentMedia.url}
        alt={product.name}
        onClick={() => setPreviewMedia({ type: 'image', url: currentMedia.url })}
        className="w-full h-106 rounded-[20px] object-cover"
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a]">
        <Loader2 className="w-12 h-12 animate-spin text-[#FF137A]" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0e1a]">
        <h2 className="font-haze uppercase text-2xl font-bold text-white mb-4">Producto no encontrado</h2>
        <button
          onClick={() => navigate('/products')}
          className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-haze uppercase px-6 py-3 rounded-full hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_18px_rgba(255,19,122,0.45)] transition-all duration-300"
        >
          Volver a productos
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="w-12 h-12 border-4 border-[#FF137A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-center">
          <h2 className="font-haze uppercase text-2xl font-bold text-white mb-4">Producto no encontrado</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-haze uppercase rounded-full hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_18px_rgba(255,19,122,0.45)] transition-all duration-300"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Agregar fuente Outfit al index.html o App.js */}
      <style>{`
        
        @keyframes rotate-bg {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.6s ease;
        }
        
        .font-outfit {
          font-family: 'Outfit', sans-serif;
        }
        
        .font-space-mono {
          font-family: 'Space Mono', monospace;
        }


        /* Vidrio esmerilado con desvanecido suave en un extremo, nunca con corte recto */
        .glass-fade-b {
          -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
        }

        .glass-fade-t {
          -webkit-mask-image: linear-gradient(to top, black 80%, transparent 100%);
          mask-image: linear-gradient(to top, black 80%, transparent 100%);
        }

        .glass-fade-r {
          -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
          mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }

        .watermark-deco {
          opacity: 0.1;
          filter: blur(2px);
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#141824] to-[#0f1419] py-34 relative overflow-x-hidden font-outfit p"
      style={{ fontFamily: '"Urbanist", sans-serif' }}>
        {/* Fondo animado */}
        <div className="fixed top-[-50%] left-[-50%] w-[200%] h-[200%] pointer-events-none z-0" style={{
          background: 'radial-gradient(circle at 20% 80%, rgba(255, 19, 122, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 255, 55, 0.1) 0%, transparent 50%)',
          animation: 'rotate-bg 30s linear infinite'
        }} />


        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Botón de regreso mejorado */}
          <nav className="mb-8">
            <button 
              onClick={() => navigate('/productos')}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium rounded-full px-6 py-3 transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_18px_rgba(255,19,122,0.45)]"
            >
              ← Volver a productos
            </button>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 animate-fadeIn">
            
            {/* Galería de imágenes */}
            <div className="space-y-5">
              {/* Imagen principal */}
              <div className="relative">
                <div className="bg-gradient-to-br from-[#FF137A]/20 h-110 via-[#000000] to-[#00FF37]/20  rounded-[20px] p-2 shadow-2xl">
                  {renderMedia()}
                  
                  {/* Flechas de navegación */}
                  {orderedMedia.length > 1 && (
                    <>
                      <button
                        onClick={prevMedia}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/20 text-white p-3 rounded-full transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_16px_rgba(255,19,122,0.5)] z-30"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextMedia}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/20 text-white p-3 rounded-full transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_16px_rgba(255,19,122,0.5)] z-30"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Miniaturas */}
              {orderedMedia.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {orderedMedia.map((media, index) => (
                    <button
                      key={media.fileName || media.url || index}
                      onClick={() => setSelectedMediaIndex(index)}
                      className={`aspect-video rounded-[20px] overflow-hidden border transition-all duration-300 bg-[#1e2433] hover:scale-105 ${
                        selectedMediaIndex === index 
                          ? 'border-white/30 shadow-lg shadow-[#FF137A]/50' 
                          : 'border-white/20 hover:border-white/30 hover:shadow-[0_0_14px_rgba(255,19,122,0.35)]'
                      }`}
                    >
                      {media.type === 'video' ? (
                        <video
                          src={media.url}
                          muted
                          loop
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img 
                          src={media.url} 
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4 text-white">
                {[
                  { icon: '⚡', title: 'Entrega Instantánea', text: 'Código digital en segundos' },
                  { icon: '🔒', title: '100% Seguro', text: 'Compra protegida' },
                  { icon: '💎', title: 'Original', text: 'Códigos oficiales' },
                  { icon: '🎁', title: 'Bonus incluidos', text: 'Contenido exclusivo' }
                ].map((feature, idx) => (
                  <div 
                    key={idx}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-[20px] p-5 transition-all duration-300 hover:bg-white/15 hover:scale-105 hover:shadow-[0_0_16px_rgba(0,255,55,0.3)]"
                  >
                    <span className="text-3xl block mb-2">{feature.icon}</span>
                    <div className="font-semibold text-sm mb-1">{feature.title}</div>
                    <div className="text-gray-400 text-xs">{feature.text}</div>
                  </div>
                ))}
              </div>
            </div>
              
            {/* Información del producto */}
            <div className="space-y-6 animate-slideInRight">
              {/* CTA Section */}
              <div className="bg-gradient-to-br from-[#1e2433] to-[#141824] backdrop-blur-xl border border-white/20 rounded-[20px] p-8 shadow-xl">
                {product.platformsFull?.length > 0 && (
                  <span className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm text-white font-haze-defog font-semibold tracking-widest uppercase mb-4">
                    🎮 {product.platformsFull.join(' . ')}
                  </span>
                )}

                {/* Título */}
                <h1 className="text-4xl font-bold mb-4 leading-tight uppercase bg-white bg-clip-text text-transparent">
                  {product.name}
                </h1>

                {/* Rating */}
                <StartRating rating={product.rating} />

                {/* Precio y stock */}
                <div className="flex items-center gap-4 my-4">
                  <div className="text-4xl font-bold text-white">
                    $ {Number(product.price).toLocaleString('en-US')} COP 
                  </div>
                  {product.stock > 0 && product.stock <= 2 && (
                    <div className="flex items-center gap-2  text-[#FF137A] px-4 py-2 rounded-full text-sm font-semibold shadow-[0_0_14px_rgba(255,19,122,0.3)]">
                      <span className="text-lg">⚠</span>
                      Stock limitado
                    </div>
                  )}
                  {product.stock >= 3 && product.stock <= 4 && (
                    <div className="flex items-center gap-2  text-[#F59E0B] px-4 py-2 rounded-full text-sm font-semibold shadow-[0_0_14px_rgba(245,158,11,0.3)]">
                      <span className="text-lg">⚠</span>
                      Stock limitado
                    </div>
                  )}
                  
                  {product.stock > 5 && (
                    <div className="flex items-center gap-2  text-[#00FF37]/80 px-4 py-2 rounded-full text-sm font-semibold shadow-[0_0_14px_rgba(0,255,55,0.3)]">
                      <span className="text-lg"></span>
                      Stock disponible
                    </div>
                  )}
                </div>
                {/* Selector de cantidad */}
               {product.stock > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-400">Cantidad:</span>
                      
                    </div>
                    <div className="flex items-center bg-white/10 border border-white/20 rounded-full overflow-hidden justify-between">
                      <div className="flex items-center pl-2">
                      <button
                        onClick={decreaseQty}
                        disabled={quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/15 hover:text-[#FF137A] transition-colors text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        −
                      </button>
                      <span className="px-6 text-white/60 ">{quantity}</span>
                      <button
                        onClick={increaseQty}
                        disabled={quantity >= product.stock}
                        className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/15 hover:text-[#FF137A] transition-colors text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        +
                      </button>
                      </div>
                      <span className="text-sm text-gray-400 pr-4">
                        Stock disponible: <span className="text-[#00FF37] font-semibold">{product.stock}</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="mb-3 mb-6 flex flex-col md:flex-row gap-4 ">
                  {product.stock > 0 ? (
                    <button
                      onClick={handleAddToCart}
                      className="w-full py-4 px-6 bg-[#FF137A]/10 backdrop-blur-md border border-[#FF137A]/30 text-white font-haze-defog font-semibold text-lg uppercase tracking-wide rounded-full shadow-[0_0_22px_rgba(255,19,122,0.45)] hover:bg-[#FF137A]/20 hover:scale-105 hover:shadow-[0_0_32px_rgba(255,19,122,0.65)] transition-all duration-300 relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2 text-[#FF137A]">
                         <span className="text-white font-haze-defog tracking-widest">Comprar ahora</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                    </button>
                  ) : (
                    <div className="w-full py-4 px-6 bg-white/10 backdrop-blur-sm border border-white/20 text-red-400 font-haze-defog tracking-widest font-bold text-lg uppercase rounded-full text-center">
                      ✗ Agotado
                    </div>
                  )}

                  <button className="w-full py-4 px-6 bg-[#00FF37]/10 backdrop-blur-sm border border-[#00FF37]/20 text-white font-haze-defog font-semibold tracking-widest  uppercase tracking-wide rounded-full hover:bg-[#00FF37]/20 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,55,0.4)] transition-all duration-300 relative overflow-hidden group">
                    Añadir a favoritos
                  </button>
                  
                </div>

                {/* Trust badges */}
                <div className="flex justify-around gap-4 pt-6 border-t border-white/20">
                  {[
                    { icon: '✓', text: 'Pago seguro' },
                    { icon: '🔄', text: 'Garantía 24h' },
                    { icon: '🌟', text: 'Verificado' }
                  ].map((badge, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="text-lg">{badge.icon}</span>
                      <span>{badge.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
            
          </div>
           {/* Tabs de descripción */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-[20px] overflow-hidden shadow-xl mt-8">
                {/* Tabs headers */}
                <div className="flex bg-black/50 backdrop-blur-md border-b border-white/20">
                  {[
                    { id: 'description', label: 'Descripción' },
                    { id: 'specs', label: 'Especificaciones' },
                    { id: 'reviews', label: 'Reseñas' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-5 px-4 font-haze uppercase tracking-wide font-semibold transition-colors relative ${
                        activeTab === tab.id 
                          ? 'text-white bg-white/10' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FF137A] shadow-[0_0_10px_rgba(255,19,122,0.7)]" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-8">
                  {activeTab === 'description' && (
                    <div className="space-y-4 text-gray-300 leading-relaxed animate-fadeIn">
                      {product.description ? (
                        <div 
                          className="prose prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                      ) : (
                        <>
                          <p>
                            Prepárate para balancearte por las calles de Nueva York como nunca antes con {product.name}. 
                            De la mano de desarrolladores de clase mundial, este juego te sumerge en una experiencia trepidante.
                          </p>
                          <p>
                            Lánzate a la acción en un mundo abierto vibrante y lleno de peligros, mientras dominas nuevos 
                            poderes y te enfrentas a enemigos formidables para proteger tu hogar.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'specs' && (
                    <div className="space-y-3 animate-fadeIn">
                      {[
                        { label: 'Plataformas', value: product.platformsFull?.length ? product.platformsFull.join(', ') : 'PC / Consola' },
                        { label: 'Género', value: product.category || 'N/A' },
                        { label: 'Desarrollador', value: product.brand || 'N/A' },
                        { label: 'Publisher', value: product.vendor || 'N/A' },
                        { label: 'Fecha de lanzamiento', value: product.releaseDate || 'N/A' },
                        { label: 'Clasificación ESRB', value: product.esrbRating || 'No especificada' },
                        { label: 'Metacritic', value: product.metacritic ?? 'N/A' },
                        { label: 'Código', value: product.code || 'N/A' },
                        { label: 'IVA', value: product.taxRate ? `${product.taxRate}%` : '19%' },
                        ...(product.website ? [{ label: 'Sitio web oficial', value: product.website, isLink: true }] : [])
                      ].map((spec, idx) => (
                        <div 
                          key={idx}
                          className="flex bg-white/10 backdrop-blur-sm border border-white/20 rounded-[20px] p-4"
                        >
                          <div className="flex-shrink-0 w-48 font-semibold text-white">{spec.label}</div>
                          {spec.isLink ? (
                            <a
                              href={spec.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#00FF37] hover:underline truncate transition-colors"
                            >
                              {spec.value}
                            </a>
                          ) : (
                            <div className="text-gray-400">{spec.value}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="animate-fadeIn">
                      <ReviewsSection productId={product._id} productName={product.name} />
                    </div>
                  )}
                </div>
              </div>       
          {/* Sección de productos relacionados */}
          {(loadingRelated || relatedProducts.length > 0) && (
            <div className="mt-16 animate-fadeIn" style={{ animationDelay: '0.8s' }}>
              <h2 className="font-haze-defog uppercase tracking-wider text-3xl font-semibold mb-8 flex items-center gap-4 text-white">
                <div className="w-1 h-10 bg-gradient-to-b from-[#FF137A] to-[#00FF37] rounded-full shadow-[0_0_12px_rgba(255,19,122,0.5)]" />
                También te puede interesar
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {loadingRelated
                  ? [1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-[20px] overflow-hidden animate-pulse"
                      >
                        <div className="aspect-video bg-gradient-to-br from-[#141824] to-[#1e2433]" />
                        <div className="p-5 space-y-3">
                          <div className="h-4 bg-white/10 rounded w-3/4" />
                          <div className="h-6 bg-white/10 rounded w-1/2" />
                        </div>
                      </div>
                    ))
                  : relatedProducts.map((related) => {
                      const cover =
                        related.media?.find((m) => m.isPoster)?.url ||
                        related.media?.[0]?.url ||
                        '';
                      return (
                        <div
                          key={related._id}
                          onClick={() => navigate(`/product/${related._id}`)}
                          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-[20px] overflow-hidden transition-all duration-300 hover:scale-105 hover:border-white/30 hover:shadow-[0_0_24px_rgba(255,19,122,0.35)] cursor-pointer"
                        >
                          <div className="aspect-video bg-gradient-to-br from-[#141824] to-[#1e2433]">
                            {cover && (
                              <img
                                src={cover}
                                alt={related.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="p-5">
                            <div className="font-semibold mb-2 text-white truncate">{related.name}</div>
                            <div className="text-2xl font-bold text-white ">
                              $ {Number(related.price).toLocaleString('en-US')} COP
                            </div>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[20px] p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-[#00FF37] text-5xl mb-4 drop-shadow-[0_0_14px_rgba(0,255,55,0.6)]">✓</div>
              <h2 className="font-haze uppercase text-2xl font-bold text-white mb-2">
                ¡Producto agregado al carrito!
              </h2>
              <p className="text-gray-400 mb-8">
                {product.name} se ha agregado exitosamente
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 hover:scale-105 text-white font-haze uppercase font-semibold transition-all duration-300"
                >
                  Seguir comprando
                </button>
                <button
                  onClick={() => navigate('/cart')}
                  className="flex-1 py-3 px-4 bg-white/10 border border-white/30 text-white rounded-full hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_22px_rgba(255,19,122,0.55)] shadow-[0_0_14px_rgba(255,19,122,0.35)] font-haze uppercase font-semibold transition-all duration-300"
                >
                  Ver carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview de media en pantalla completa */}
      {previewMedia && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewMedia(null)}
        >
          <button
            onClick={() => setPreviewMedia(null)}
            className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white p-3 rounded-full hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_16px_rgba(255,19,122,0.45)] transition-all duration-300 z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          {orderedMedia.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevMedia(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm border border-white/20 text-white p-4 rounded-full hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_16px_rgba(255,19,122,0.45)] transition-all duration-300 z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextMedia(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm border border-white/20 text-white p-4 rounded-full hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_16px_rgba(255,19,122,0.45)] transition-all duration-300 z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
          
          <div onClick={(e) => e.stopPropagation()} className="max-w-6xl max-h-[90vh] w-full">
            {previewMedia.type === 'image' ? (
              <img 
                src={previewMedia.url} 
                alt="Preview" 
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <video 
                src={previewMedia.url} 
                controls 
                autoPlay
                muted
                onPlay={(e) => {
                  e.target.muted = false;
                  e.target.volume = INITIAL_VIDEO_VOLUME;
                }}
                className="w-full h-full max-h-[90vh] rounded-xl"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetail;