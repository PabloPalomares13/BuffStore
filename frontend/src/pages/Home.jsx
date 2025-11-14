
import React, { useState, useEffect, useRef } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { ChevronLeft, ChevronRight,ShoppingCart } from "lucide-react";
import 'react-lazy-load-image-component/src/effects/blur.css'; 
import fondoAro1 from "../assets/fondoAro1.png"; // tu imagen del aro verde (PNG)
import personaje1 from "../assets/personaje1.png"; // izquierda
import personaje2 from "../assets/personaje2.png"; // centro
import personaje3 from "../assets/personaje3.png";
import logo from "../assets/logobuff0033.png";
import { useNavigate } from 'react-router-dom';
const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'

const logos = [
    
    {
      name: 'Ubisoft',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Ubisoft_logo.svg/250px-Ubisoft_logo.svg.png',
      singleTone: true
    },
    {
      name: 'EA',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/EA_Sports_monochrome_logo.svg/250px-EA_Sports_monochrome_logo.svg.png',
      singleTone: true
    },
    {
      name: 'Activision',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Activision.svg/250px-Activision.svg.png',
      singleTone: true
    },
    {
      name: 'Riot',
      url: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5b/Riot_Games_2022.svg/250px-Riot_Games_2022.svg.png',
      singleTone: true
    },
  
    {
      name: 'Epic Games',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Epic_Games_Store_logo_2023_vertical_black.svg/800px-Epic_Games_Store_logo_2023_vertical_black.svg.png',
      singleTone: true
    },
    {
      name: 'Sony',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/250px-Sony_logo.svg.png',
      singleTone: true
    },
    {
      name: 'Xbox',
      url: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Xbox_logo_%282019%29.svg',
      singleTone: true
    },
    {
      name: 'PlayStation',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/PlayStation_logo_and_wordmark.svg/1920px-PlayStation_logo_and_wordmark.svg.png',
      singleTone: true
    }
  ]
  
  const Home = () => {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(3);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const scrollContainerRef = useRef(null);
    const autoScrollRef = useRef(null);
    
    const navigate = useNavigate();
    const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    };

    const fetchProducts = async () => {
        try {
          const response = await fetch(`${link}/api/products`);
          if (!response.ok) {
            throw new Error("Error al obtener los productos");
          }
          const data = await response.json();
          
          // Ahora las imágenes son URLs directas de Google Cloud Storage
          const productsWithImages = data.map(product => {
            if (product.images && product.images.length > 0) {
              return { 
                ...product, 
                displayImageUrl: product.images[0] // Usar directamente la URL de GCS
              };
            }
            return {
              ...product,
              displayImageUrl: '/path/to/placeholder.jpg' // Tu placeholder
            };
          });
          
          // 🔥 AGREGAR ESTO: Crear copias para efecto infinito
          const infiniteProducts = [
            ...productsWithImages.slice(-3), // últimos 3 al inicio
            ...productsWithImages,           // todos los productos
            ...productsWithImages.slice(0, 3) // primeros 3 al final
          ];
          
          setProducts(infiniteProducts); // Cambiar esto
          setLoading(false);
          
        } catch (err) {
          console.error(err);
          setLoading(false);
        }
      };

      useEffect(() => {
        fetchProducts();
      }, []);
      

      useEffect(() => {
        if (isAutoScrolling && products.length > 0) {
          autoScrollRef.current = setInterval(() => {
            setCurrentIndex((prev) => {
              const newIndex = prev + 1;
              if (newIndex >= products.length - 3) {
                setTimeout(() => setCurrentIndex(3), 700);
                return newIndex;
              }
              return newIndex;
            });
          }, 3500);
        }
        
        return () => {
          if (autoScrollRef.current) {
            clearInterval(autoScrollRef.current);
          }
        };
      }, [isAutoScrolling, products.length]);

      const handleAddToCart = (product) => {
        setSelectedProduct(product);
        setShowModal(true);
    
        // Obtener el carrito actual del localStorage o crear uno nuevo
        const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    
        // Verificar si el producto ya está en el carrito
        const existingProductIndex = currentCart.findIndex(item => item._id === product._id);
    
        // Crear un objeto con solo los datos necesarios para el carrito
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
    
        // Guardar el carrito actualizado
        localStorage.setItem('cart', JSON.stringify(currentCart));
    };

      const handleContinueShopping = () => {
        setShowModal(false);
      };
      
      // Función para ir a checkout
      const handleGoToCheckout = () => {
        window.location.href = '/checkout';
      };

      const handlePrevious = () => {
        setIsAutoScrolling(false);
        setCurrentIndex((prev) => {
          const newIndex = prev - 1;
          // Si llega al inicio (posición 2), salta al final real
          if (newIndex < 3) {
            setTimeout(() => setCurrentIndex(products.length - 4), 700);
            return newIndex;
          }
          return newIndex;
        });
      };

      const handleNext = () => {
        setIsAutoScrolling(false);
        setCurrentIndex((prev) => {
          const newIndex = prev + 1;
          // Si llega al final (posición length-3), salta al inicio real
          if (newIndex >= products.length - 3) {
            setTimeout(() => setCurrentIndex(3), 700);
            return newIndex;
          }
          return newIndex;
        });
      };

      const getCardStyle = (index) => {
          const diff = index - currentIndex;
          const absPosition = Math.abs(diff);
          
          // Cartas visibles: -2, -1, 0 (centro), 1, 2
          if (absPosition > 2) {
            return { display: 'none' };
          }

          const isCenter = diff === 0;
          const scale = isCenter ? 1.15 : 1 - (absPosition * 0.15);
          const translateX = diff * 320;
          const translateZ = isCenter ? 50 : -100 * absPosition;
          const opacity = isCenter ? 1 : 1 - (absPosition * 0.25);
          const blur = isCenter ? 0 : absPosition * 2;

          return {
            transform: `translateX(${translateX}px) translateZ(${translateZ}px) scale(${scale})`,
            opacity,
            filter: `blur(${blur}px)`,
            zIndex: 10 - absPosition,
            transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
          };
        };

        if (products.length === 0) {
          return (
            <div className="flex items-center justify-center h-96">
              <div className="text-gray-400 text-xl">Cargando productos...</div>
            </div>
          );
        }

    return (
    <>  
      <div className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-black via-[#001a00] to-[#00ff73]/10 flex items-center justify-center">
        {/* Fondo verde circular superpuesto bg-gradient-to-b from-black via-[#001a00] to-[#00ff73]/10*/}
        <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute w-full h-full flex items-center justify-center">
              <div className="relative w-[95%] sm:w-[90%] md:w-[85%] lg:w-[75%] xl:w-[65%] h-[60%] sm:h-[65%] md:h-[70%]">
              {/* Personaje Izquierdo */}
              <div className="absolute left-0 top-[40%] -translate-y-1/2 w-[38%] sm:w-[36%] md:w-[32%] lg:w-[34%]">
                <div className="relative w-full h-full flex items-center justify-center group">
                  <img 
                    src={personaje1} 
                    alt="Personaje 1" 
                    className="w-full h-auto object-contain transition-transform duration-800 ease-out group-hover:scale-105 group-hover:drop-shadow-[0_0_25px_rgba(255,0,128,0.5)]"
                  />
                </div>
              </div>

              {/* Personaje Centro (Master Chief) */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[38%] -translate-y-1/2 w-[42%] sm:w-[38%] md:w-[35%] lg:w-[36%]">
                <div className="relative w-full h-full flex items-center justify-center group">
                  <img 
                    src={personaje2} 
                    alt="Personaje 2" 
                    className="w-full h-auto object-contain transition-transform duration-800 ease-out group-hover:scale-105 group-hover:drop-shadow-[0_0_25px_rgba(255,0,128,0.5)]"
                  />
                </div>
              </div>

              {/* Personaje Derecho */}
              <div className="absolute right-0 top-[40%] -translate-y-1/2 w-[40%] sm:w-[34%] md:w-[32%] lg:w-[32%]">
                <div className="relative w-full h-full flex items-center justify-center group">
                  <img 
                    src={personaje3} 
                    alt="Personaje 3" 
                    className="w-full h-auto object-contain transition-transform duration-800 ease-out group-hover:scale-105 group-hover:drop-shadow-[0_0_25px_rgba(255,0,128,0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>
          
            <div className="absolute bottom-0 w-full h-full flex items-end justify-center pointer-events-none">
              <img 
                src={fondoAro1} 
                alt="Aro verde" 
                className="w-[100%] object-cover opacity-90 h-[100%] sm:h-[100%] md:h-[100%] lg:h-[100%] drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
              />
            </div>
          
            {/* test */}
          <div className="absolute bottom-16 sm:bottom-20 text-center px-4 z-20">
            <div className="backdrop-blur-lg bg-white/10 py-6 px-8 sm:py-8 sm:px-10 md:py-10 md:px-14 rounded-2xl inline-block shadow-[0_0_30px_rgba(0,255,115,0.2)]">
              <h1 className="font-['Quantico'] font-medium text-white drop-shadow-lg leading-tight text-[clamp(2.5rem,8vw,6rem)]">
                Buff Store
              </h1>
              <p className="font-['Quantico'] font-semibold text-white mt-4 drop-shadow-lg leading-snug text-[clamp(1rem,3vw,1.75rem)]">
                La Plataforma de venta de codigos para videojuegos <br className="hidden sm:block" /> y microtransacciones mas confiable del mercado
              </p>
            </div>
          </div>

          {/* Efecto de viñeta en los bordes */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"></div>
        </div>
      </div>


      <div className="relative w-full py-20 my-10">
        {/* Fondo con degradado */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#121212] via-white/15 to-[#121212]" />
        {/* Contenido del carrusel centrado */}
        <div className="relative z-10 mx-auto w-full px-4 md:px-8 h-[35vh] flex flex-col justify-center space-y-30">
          <div
            className="group relative flex gap-6 overflow-hidden p-2 items-center justify-center"
            style={{
              maskImage:
                'linear-gradient(to left, transparent 0%, black 20%, black 80%, transparent 95%)',
            }}
          >
            {Array(5)
              .fill(null)
              .map((_, index) => (
                <div
                  key={index}
                  className="flex shrink-0 animate-logo-cloud-left flex-row justify-around gap-6 items-center"
                >
                  {logos.map((logo, key) => (
                    <div
                      key={key}
                      className="flex items-center justify-center bg-transparent p-2 "
                      style={{
                        width: "180px",
                        height: "80px",
                      }}
                    >
                      <div className="relative w-full h-full flex ">
                        <img
                          src={logo.url}
                          alt={logo.name}
                          className="absolute top-0 left-0 right-0 bottom-0 m-auto max-w-full max-h-full object-contain pointer-events-none"
                          style={{
                            filter: logo.singleTone
                              ? "brightness(0) invert(1)" // solo para logos monocromáticos
                              : "none", // logos de color quedan intactos
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
          <div
            className="group relative flex gap-6 overflow-hidden p-2 items-center justify-center"
            style={{
              maskImage:
                'linear-gradient(to left, transparent 0%, black 20%, black 80%, transparent 95%)',
            }}
          >
            {Array(5)
              .fill(null)
              .map((_, index) => (
                <div
                  key={index}
                  className="flex shrink-0 animate-logo-cloud-right flex-row justify-around gap-6 items-center"
                >
                  {logos.map((logo, key) => (
                    <div
                      key={key}
                      className="flex items-center justify-center bg-transparent p-2"
                      style={{
                        width: "180px",
                        height: "80px",
                      }}
                    >
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={logo.url}
                          alt={logo.name}
                          className="absolute top-0 left-0 right-0 bottom-0 m-auto max-w-full max-h-full object-contain"
                          style={{
                            filter: logo.singleTone
                              ? "brightness(0) invert(0)" // solo para logos monocromáticos
                              : "none", // logos de color quedan intactos
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
        
      </div>    
  
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
        <div className="relative w-full py-16 px-4 bg-gradient-to-b from-black via-[#0a0a0a] to-black overflow-hidden">
          {/* Título */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-['Quantico'] font-bold text-white bg-clip-text text-transparent mb-3">
              Productos Destacados
            </h2>
            <p className="text-gray-400 text-lg">Explora nuestra colección exclusiva</p>
          </div>

          {/* Carrusel Container */}
          <div 
            className="relative h-[550px] flex items-center justify-center"
            style={{ perspective: '2000px' }}
            onMouseEnter={() => setIsAutoScrolling(false)}
            onMouseLeave={() => setIsAutoScrolling(true)}
          >
            {/* Cards Container */}
            <div className="relative w-full h-full flex items-center justify-center">
              {products.map((product, index) => (
                <div
                  key={`${product._id}-${index}`} 
                  className="absolute w-[380px] h-[450px] cursor-pointer"
                  style={getCardStyle(index)}
                  onClick={() => handleProductClick(product._id)}
                >
                  <div className="relative w-full h-full bg-gradient-to-br from-[#1a1a1a]/90 via-[#2a2a2a]/80 to-[#000000]/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden group">
                    {/* Imagen del producto */}
                    {product.displayImageUrl ? (
                      <div className="absolute inset-0 overflow-hidden">
                        <img
                          src={product.displayImageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
                        No image available
                      </div>
                    )}

                    {/* Overlay degradado */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />

                    {/* Glow effect en hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF0080]/20 via-transparent to-[#00ff73]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Contenido */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(product.tags || product.category || [])
                          .toString()
                          .split(',')
                          .slice(0, 2)
                          .map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 font-medium text-white/90 hover:bg-white/25 transition-colors duration-300"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                      </div>

                      {/* Título */}
                      <h3 className="text-2xl font-bold mb-2 text-white leading-tight drop-shadow-lg">
                        {product.name}
                      </h3>

                      {/* Precio */}
                      <p className="text-3xl font-bold bg-gradient-to-r from-[#FF0080] to-[#00ff73] bg-clip-text text-transparent mb-4">
                        ${Number(product.price).toLocaleString('en-US')}
                      </p>

                      {/* Botón */}
                      <button
                        onClick={(e) => {e.stopPropagation(); // Evitar que se active el click del card
                                      handleAddToCart(product);}}
                        className="group/btn relative w-full py-3.5 rounded-2xl overflow-hidden bg-gradient-to-r from-[#FF0080]/70 via-[#121212]/70 to-[#00ff73]/70 bg-[length:200%_auto] hover:bg-[position:100%_center] transition-all duration-800 text-white font-bold shadow-lg hover:shadow-[#FF0080]/50 transition-all duration-300 hover:scale-105 active:scale-95"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <ShoppingCart className="w-5 h-5" />
                          Agregar al carrito
                        </span>
                      </button>
                    </div>

                    {/* Corner decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FF0080]/30 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>
              ))}
            </div>

            {/* Botones de navegación */}
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-gradient-to-r from-[#FF0080]/80 to-[#121212] backdrop-blur-xl flex items-center justify-center text-white shadow-2xl hover:scale-110 hover:shadow-[#FF0080]/50 transition-all duration-300 active:scale-95"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-gradient-to-r from-[#121212] to-[#00ff73]/80 backdrop-blur-xl  flex items-center justify-center text-white shadow-2xl hover:scale-110 hover:shadow-[#00ff73]/50 transition-all duration-300 active:scale-95"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </div>

          {/* Indicadores de posición */}
          <div className="flex justify-center gap-2 mt-8">
            {products.slice(3, -3).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index + 3);
                  setIsAutoScrolling(false);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 bg-gradient-to-r from-[#FF0080] to-[#00ff73]'
                    : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Auto-scroll indicator */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className="text-sm text-gray-400 hover:text-white transition-colors duration-300"
            >
              {isAutoScrolling ? '⏸ Pausar' : '▶ Reanudar'} auto-scroll
            </button>
          </div>
        </div>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Producto añadido al carrito</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {selectedProduct && (
                <div className="flex items-center mb-4">
                  {selectedProduct.displayImageUrl && (
                    <img 
                      src={selectedProduct.displayImageUrl} 
                      alt={selectedProduct.name} 
                      className="h-20 w-20 object-cover rounded-md mr-4" 
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{selectedProduct.name}</p>
                    <p className="text-gray-600">${selectedProduct.price.toFixed(2)}</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between mt-6">
                <button
                  onClick={handleContinueShopping}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Seguir comprando
                </button>
                <button
                  onClick={handleGoToCheckout}
                  className="px-4 py-2 rounded-md text-white hover:opacity-90 transition-colors"
                  style={{ backgroundImage: "linear-gradient(90deg,rgba(189, 157, 212, 1) 0%, rgba(125, 209, 199, 1) 99%)"}}
                >
                  Ir a pagar
                </button>
              </div>
            </div>
          </div>
        )}
        <div
            id="texto-principal"
            className="bg-animated h-[75vh]  flex flex-col justify-center items-center text-center text-white font-inter px-6 sm:px-8 md:px-12"
          >
            <img
              src={logo}
              alt="Buff Store"
              className="w-44 md:w-52 lg:w-64 mb-8 drop-shadow-[0_0_25px_rgba(0,255,115,0.8)]"
            />

            <div className="flex flex-col items-center mt-6 space-y-6 w-full">
              <h3 className="font-['Quantico'] font-bold text-gray-200 text-4xl leading-snug lg:leading-tight tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] max-w-[65ch]">
                Una nueva forma de vivir la experiencia gamer.
              </h3>

              <p className="font-['Quantico'] text-gray-200  sm:text-1xl md:text-2xl lg:text-3xl leading-relaxed lg:leading-normal tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] max-w-[80ch]">
                Buff Store combina tecnología moderna, seguridad y un diseño intuitivo para ofrecerte una
                experiencia rápida, confiable y sin complicaciones. Compra tus códigos de videojuegos con total
                confianza y disfruta de soporte 24/7 para cualquier necesidad.
              </p>
            </div> 
          </div> 
        

    </>
    )
}    

export default Home;