import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2,X,Video,  ShoppingCart, Plus, Minus } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams(); // Obtener el ID del producto desde la URL
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [activeTab, setActiveTab] = useState('description');

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

  // Función para obtener datos adicionales de la API externa (por ejemplo, RAWG)
  const fetchApiData = async (gameName) => {
    try {

      const apiKey = import.meta.env.VITE_API_GAMES_INFO; 
      const response = await fetch(
        `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(gameName)}&page_size=1`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const gameData = data.results[0];
        
        // Obtener detalles adicionales del juego
        const detailResponse = await fetch(
          `https://api.rawg.io/api/games/${gameData.id}?key=${apiKey}`
        );
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          setApiData(detailData);
          return detailData;
        }
      }
    } catch (err) {
      console.error('Error fetching API data:', err);
    }
    return null;
  };

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const loadData = async () => {
      setLoading(true);
      const productData = await fetchProductData();
      
      if (productData) {
        // Obtener datos adicionales de la API usando el nombre del producto
        await fetchApiData(productData.name);
      }
      
      setLoading(false);
    };

    loadData();
  }, [id]);

  // Función para agregar al carrito
  const handleAddToCart = () => {
    if (!product) return;

    const cartItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: product.media?.[0]?.url || product.images?.[0] || ''
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
  const newIndex = (selectedMediaIndex + 1) % product.media.length;
  setSelectedMediaIndex(newIndex);
  if (previewMedia) { // ← NUEVO: Actualiza el modal
    const media = product.media[newIndex];
    setPreviewMedia({ type: media.type, url: media.url, thumbnail: media.thumbnail });
  }
};

  const prevMedia = () => {
    if (product?.media?.length > 0) {
      setSelectedMediaIndex((prev) => 
        prev === 0 ? product.media.length - 1 : prev - 1
      );
    }
  };
  // Renderizar galería de imágenes
  const renderMedia = () => {
    if (!product?.media || product.media.length === 0) {
      return (
        <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Sin imagen disponible</p>
        </div>
      );
    }

    const currentMedia = product.media[selectedMediaIndex];

    if (currentMedia.type === 'video') {
      return (
        <video
          key={currentMedia.url}
          autoPlay
          loop
          playsInline
          controls
          onClick={() => setPreviewMedia({ type: 'video', url: currentMedia.url, thumbnail: currentMedia.thumbnail })}
          className="w-full h-96 rounded-lg object-cover"
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
        className="w-full h-96 rounded-lg object-cover"
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Producto no encontrado</h2>
        <button
          onClick={() => navigate('/products')}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Volver a productos
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Producto no encontrado</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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
        'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap'
        
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
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#141824] to-[#0f1419] py-8 pt-24 relative overflow-x-hidden font-outfit">
        {/* Fondo animado */}
        <div className="fixed top-[-50%] left-[-50%] w-[200%] h-[200%] pointer-events-none z-0" style={{
          background: 'radial-gradient(circle at 20% 80%, rgba(255, 0, 85, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 217, 255, 0.1) 0%, transparent 50%)',
          animation: 'rotate-bg 30s linear infinite'
        }} />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Botón de regreso mejorado */}
          <nav className="mb-8">
            <button 
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 text-white font-medium rounded-full px-6 py-3 transition-all duration-300 hover:bg-white/10 hover:transform hover:-translate-x-1 hover:border-[#ff0055]"
            >
              ← Volver a productos
            </button>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 animate-fadeIn">
            
            {/* Galería de imágenes */}
            <div className="space-y-5">
              {/* Imagen principal */}
              <div className="relative">
                <div className="bg-gradient-to-br from-[#141824] to-[#1e2433] border border-white/10 rounded-3xl p-4 shadow-2xl">
                  {renderMedia()}
                  
                  {/* Flechas de navegación */}
                  {product.media && product.media.length > 1 && (
                    <>
                      <button
                        onClick={prevMedia}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/10 text-white p-3 rounded-full hover:bg-[#ff0055] hover:border-[#ff0055] transition-all duration-300 hover:scale-110 z-30"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextMedia}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/10 text-white p-3 rounded-full hover:bg-[#ff0055] hover:border-[#ff0055] transition-all duration-300 hover:scale-110 z-30"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Miniaturas */}
              {product.media && product.media.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.media.map((media, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMediaIndex(index)}
                      className={`aspect-video rounded-xl overflow-hidden border-2 transition-all duration-300 bg-[#1e2433] hover:-translate-y-1 ${
                        selectedMediaIndex === index 
                          ? 'border-[#ff0055] shadow-lg shadow-[#ff0055]/50' 
                          : 'border-transparent hover:border-[#ff0055]'
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
                    className="bg-white/3 backdrop-blur-sm border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:bg-white/6 hover:border-[#ff0055] hover:-translate-y-1"
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
              
              {/* Header del producto */}
              <div className="bg-gradient-to-br from-[#ff0055]/10 to-[#00d9ff]/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
                {/* Badge de plataforma */}
                {product.platform && (
                  <span className="inline-block bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase mb-4">
                    🎮 {product.platform}
                  </span>
                )}

                {/* Título */}
                <h1 className="text-4xl font-extrabold mb-4 leading-tight bg-gradient-to-r from-white to-[#00d9ff] bg-clip-text text-transparent">
                  {product.name}
                </h1>

                {/* Rating */}
                {apiData?.rating && (
                  <div className="flex items-center gap-3 py-4 border-t border-b border-white/10">
                    <div className="flex gap-1 text-[#ffaa00] text-xl">
                      {'★'.repeat(Math.round(apiData.rating))}
                      {'☆'.repeat(5 - Math.round(apiData.rating))}
                    </div>
                    <span className="text-gray-400 text-sm">
                      {apiData.rating}/5 ({apiData.ratings_count || 937} reseñas)
                    </span>
                  </div>
                )}

                {/* Precio y stock */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="text-5xl font-extrabold text-[#00ff88] font-space-mono">
                    ${Number(product.price).toLocaleString('en-US')}
                  </div>
                  {product.stock > 0 && product.stock <= 10 && (
                    <div className="flex items-center gap-2 bg-[#ffaa00]/20 border border-[#ffaa00] text-[#ffaa00] px-4 py-2 rounded-full text-sm font-semibold">
                      <span className="text-lg">⚠</span>
                      Stock limitado
                    </div>
                  )}
                </div>
              </div>

              

              {/* CTA Section */}
              <div className="bg-gradient-to-br from-[#1e2433] to-[#141824] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
                
                {/* Selector de cantidad */}
               {product.stock > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-400">Cantidad:</span>
                      
                    </div>
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-full overflow-hidden justify-between">
                      <div className="flex items-center pl-2">
                      <button
                        onClick={decreaseQty}
                        disabled={quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center text-white hover:bg-[#ff0055] transition-all text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        −
                      </button>
                      <span className="px-6 text-white/60 ">{quantity}</span>
                      <button
                        onClick={increaseQty}
                        disabled={quantity >= product.stock}
                        className="w-10 h-10 flex items-center justify-center text-white hover:bg-[#ff0055] transition-all text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      >
                        +
                      </button>
                      </div>
                      <span className="text-sm text-gray-400 pr-4">
                        Stock disponible: <span className="text-[#00ff88] font-semibold">{product.stock}</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="mb-3 mb-6 flex flex-col md:flex-row gap-4 ">
                  {product.stock > 0 ? (
                    <button
                      onClick={handleAddToCart}
                      className="w-full py-4 px-6 bg-gradient-to-r from-[#ff0055] to-[#cc0044] text-white font-bold text-lg rounded-2xl shadow-lg shadow-[#ff0055]/30 hover:shadow-[#ff0055]/50 transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        🛒 Comprar ahora
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                    </button>
                  ) : (
                    <div className="w-full py-4 px-6 bg-red-500/20 border border-red-500 text-red-400 font-bold text-lg rounded-2xl text-center">
                      ✗ Agotado
                    </div>
                  )}

                  <button className="w-full py-4 px-6 bg-white/5 backdrop-blur-sm border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/10 hover:border-[#00d9ff] transition-all duration-300">
                    ♥ Añadir a favoritos
                  </button>
                </div>

                {/* Trust badges */}
                <div className="flex justify-around gap-4 pt-6 border-t border-white/10">
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
              <div className="bg-white/3 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-xl mt-8">
                {/* Tabs headers */}
                <div className="flex bg-black/30 border-b border-white/10">
                  {[
                    { id: 'description', label: 'Descripción' },
                    { id: 'specs', label: 'Especificaciones' },
                    { id: 'reviews', label: 'Reseñas' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-5 px-4 font-semibold transition-all relative ${
                        activeTab === tab.id 
                          ? 'text-white bg-[#ff0055]/10' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-[#ff0055]" />
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
                        { label: 'Plataforma', value: product.platform || 'PC / Consola' },
                        { label: 'Género', value: apiData?.genres?.map(g => g.name).join(', ') || product.category },
                        { label: 'Desarrollador', value: apiData?.developers?.[0]?.name || product.brand || 'N/A' },
                        { label: 'Fecha de lanzamiento', value: apiData?.released || 'N/A' },
                        { label: 'Clasificación', value: product.rating || 'PEGI 16 / ESRB Teen' },
                        { label: 'Código', value: product.code || 'N/A' },
                        { label: 'IVA', value: product.taxRate ? `${product.taxRate}%` : '19%' }
                      ].map((spec, idx) => (
                        <div 
                          key={idx}
                          className="flex bg-white/3 backdrop-blur-sm border border-white/10 rounded-xl p-4"
                        >
                          <div className="flex-shrink-0 w-48 font-semibold text-white">{spec.label}</div>
                          <div className="text-gray-400">{spec.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-4 animate-fadeIn">
                      <p className="text-gray-300 leading-relaxed mb-6">
                        Con más de {apiData?.ratings_count || 937} reseñas positivas, {product.name} ha cautivado a 
                        jugadores de todo el mundo. Los usuarios destacan sus impresionantes gráficos de última generación, 
                        su fluida jugabilidad y una historia emocionante.
                      </p>

                      {/* Ejemplos de reseñas */}
                      {[
                        { author: 'JM', name: 'Jorge Martínez', rating: 5, text: 'Una obra maestra visual y narrativa. Los gráficos son impresionantes y el gameplay es súper fluido. Vale cada peso.', helpful: 24, date: 'Hace 2 días' },
                        { author: 'AL', name: 'Andrea López', rating: 5, text: 'El mejor juego que he jugado. El sistema de combate es adictivo. Totalmente recomendado.', helpful: 18, date: 'Hace 5 días' },
                        { author: 'CR', name: 'Carlos Ruiz', rating: 4, text: 'Excelente juego aunque un poco corto. La banda sonora es increíble. Compra recomendada.', helpful: 31, date: 'Hace 1 semana' }
                      ].map((review, idx) => (
                        <div key={idx} className="bg-white/3 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/5 hover:border-[#ff0055] transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff0055] to-[#00d9ff] flex items-center justify-center font-bold text-sm">
                                {review.author}
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{review.name}</div>
                                <div className="text-xs text-gray-500">{review.date}</div>
                              </div>
                            </div>
                            <div className="flex gap-1 text-[#ffaa00]">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed mb-4">{review.text}</p>
                          <div className="flex items-center gap-3 pt-4 border-t border-white/10 text-sm text-gray-400">
                            <span>¿Te resultó útil?</span>
                            <button className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg hover:bg-[#00ff88]/10 hover:border-[#00ff88] hover:text-[#00ff88] transition-all">
                              👍 Sí ({review.helpful})
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>       
          {/* Sección de productos relacionados */}
          <div className="mt-16 animate-fadeIn" style={{ animationDelay: '0.8s' }}>
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-4">
              <div className="w-1 h-10 bg-gradient-to-b from-[#ff0055] to-[#00d9ff] rounded-full" />
              También te puede interesar
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Aquí mapearías tus productos relacionados */}
              {[1, 2, 3, 4].map((item) => (
                <div 
                  key={item}
                  className="bg-white/3 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-[#ff0055] hover:shadow-2xl cursor-pointer"
                >
                  <div className="aspect-video bg-gradient-to-br from-[#141824] to-[#1e2433]" />
                  <div className="p-5">
                    <div className="font-semibold mb-2 text-white">Producto relacionado {item}</div>
                    <div className="text-2xl font-bold text-[#00ff88] font-space-mono">$299,000</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-[#1e2433] to-[#141824] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-[#00ff88] text-5xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                ¡Producto agregado al carrito!
              </h2>
              <p className="text-gray-400 mb-8">
                {product.name} se ha agregado exitosamente
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 border border-white/10 rounded-xl hover:bg-white/5 text-white font-semibold transition-all"
                >
                  Seguir comprando
                </button>
                <button
                  onClick={() => navigate('/cart')}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-[#ff0055] to-[#cc0044] text-white rounded-xl hover:shadow-lg hover:shadow-[#ff0055]/50 font-semibold transition-all"
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
            className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white p-3 rounded-full hover:bg-white/20 transition z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          {product.media && product.media.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevMedia(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm border border-white/20 text-white p-4 rounded-full hover:bg-white/20 transition z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextMedia(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm border border-white/20 text-white p-4 rounded-full hover:bg-white/20 transition z-10"
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