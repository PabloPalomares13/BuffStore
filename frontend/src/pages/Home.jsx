
import React, { useState, useEffect, useRef,useMemo } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { ChevronLeft, ChevronRight,ShoppingCart } from "lucide-react";
import { getFeaturedProducts } from "../services/productService";
import FeaturedProducts from "../components/ui/FeaturedProducts";
import 'react-lazy-load-image-component/src/effects/blur.css'; 
import fondo from "../assets/fondogradient.png";
import buff from "../assets/Buff1.png";
import store from "../assets/Store.png";
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
      name: 'Rockstar Games',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Rockstar_Games.svg/960px-Rockstar_Games.svg.png?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
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
  const cardsData = [
        {
            image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200',
            name: 'Briar Martin',
            handle: '@neilstellar',
            date: 'April 20, 2025'
        },
        {
            image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
            name: 'Avery Johnson',
            handle: '@averywrites',
            date: 'May 10, 2025'
        },
        {
            image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60',
            name: 'Jordan Lee',
            handle: '@jordantalks',
            date: 'June 5, 2025'
        },
        {
            image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60',
            name: 'Avery Johnson',
            handle: '@averywrites',
            date: 'May 10, 2025'
        },
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
    const [error, setError] = useState(null);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);
    const [errorFeatured, setErrorFeatured] = useState(null);
    
    const navigate = useNavigate();
    const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    };
    useEffect(() => {
      const fetchFeatured = async () => {
        try {
          const response = await fetch(`${link}/api/products/featured`);
          if (!response.ok) throw new Error("Error al obtener los productos destacados");
          const data = await response.json();
          setFeaturedProducts(data);
        } catch (err) {
          setErrorFeatured(err.message);
        } finally {
          setLoadingFeatured(false);
        }
      };
      fetchFeatured();
    }, []);
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

        // if (products.length === 0) {
        //   return (
        //     <div className="flex items-center justify-center h-96">
        //       <div className="text-gray-400 text-xl">Cargando productos...</div>
        //     </div>
        //   );
        // }
    
    const CreateCard = ({ card }) => (
    <div className="p-10 rounded-lg mx-2 shadow-lg shadow-gray-600/30 hover:shadow-xl transition-all duration-200 w-72 shrink-0 bg-neutral-800/60 backdrop-blur-sm border border-neutral-700">
        <div className="flex gap-2">
            <img className="size-11 rounded-full border-2 border-slate-700" src={card.image} alt="User Image" />
            <div className="flex flex-col">
                <div className="flex items-center gap-1">
                    <p className="text-slate-100 font-medium">{card.name}</p>
                    <svg className="mt-0.5" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M4.555.72a4 4 0 0 1-.297.24c-.179.12-.38.202-.59.244a4 4 0 0 1-.38.041c-.48.039-.721.058-.922.129a1.63 1.63 0 0 0-.992.992c-.071.2-.09.441-.129.922a4 4 0 0 1-.041.38 1.6 1.6 0 0 1-.245.59 3 3 0 0 1-.239.297c-.313.368-.47.551-.56.743-.213.444-.213.96 0 1.404.09.192.247.375.56.743.125.146.187.219.24.297.12.179.202.38.244.59.018.093.026.189.041.38.039.48.058.721.129.922.163.464.528.829.992.992.2.071.441.09.922.129.191.015.287.023.38.041.21.042.411.125.59.245.078.052.151.114.297.239.368.313.551.47.743.56.444.213.96.213 1.404 0 .192-.09.375-.247.743-.56.146-.125.219-.187.297-.24.179-.12.38-.202.59-.244a4 4 0 0 1 .38-.041c.48-.039.721-.058.922-.129.464-.163.829-.528.992-.992.071-.2.09-.441.129-.922a4 4 0 0 1 .041-.38c.042-.21.125-.411.245-.59.052-.078.114-.151.239-.297.313-.368.47-.551.56-.743.213-.444.213-.96 0-1.404-.09-.192-.247-.375-.56-.743a4 4 0 0 1-.24-.297 1.6 1.6 0 0 1-.244-.59 3 3 0 0 1-.041-.38c-.039-.48-.058-.721-.129-.922a1.63 1.63 0 0 0-.992-.992c-.2-.071-.441-.09-.922-.129a4 4 0 0 1-.38-.041 1.6 1.6 0 0 1-.59-.245A3 3 0 0 1 7.445.72C7.077.407 6.894.25 6.702.16a1.63 1.63 0 0 0-1.404 0c-.192.09-.375.247-.743.56m4.07 3.998a.488.488 0 0 0-.691-.69l-2.91 2.91-.958-.957a.488.488 0 0 0-.69.69l1.302 1.302c.19.191.5.191.69 0z" fill="#2196F3" />
                    </svg>
                </div>
                <span className="text-xs text-slate-500">{card.handle}</span>
            </div>
        </div>
        <p className="text-sm py-4 text-slate-300 leading-relaxed">
            Radiant made undercutting all of our competitors an absolute breeze.
        </p>
        <div className="flex items-center justify-between text-slate-500 text-xs">
            <div className="flex items-center gap-1">
                <span>Posted on</span>
                <a href="https://x.com" target="_blank" className="hover:text-sky-400 transition-colors">
                    <svg width="11" height="10" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="m.027 0 4.247 5.516L0 10h.962l3.742-3.926L7.727 10H11L6.514 4.174 10.492 0H9.53L6.084 3.616 3.3 0zM1.44.688h1.504l6.64 8.624H8.082z" fill="currentColor" />
                    </svg>
                </a>
            </div>
            <p>{card.date}</p>
        </div>
    </div>
);
    return (
    <>  
      <div
        className="relative flex min-h-screen w-full items-center justify-end overflow-hidden bg-cover bg-center bg-no-repeat flex-col"
        style={{ backgroundImage: `url(${fondo})` }}
      > 
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none px-4">
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-2 md:gap-10 lg:gap-6">
            <img
              src={buff}
              alt="Buff"
              className="h-auto object-contain"
              style={{ width: "clamp(280px, 38vw, 640px)" }}
            />
            <img
              src={store}
              alt="Store"
              className="h-auto object-contain"
              style={{ width: "clamp(280px, 38vw, 640px)" }}
            />
          </div>
        </div>
        {/* Tu contenido */}
        <div className="relative w-full bg-transparent">
        <div className="relative z-10 mx-auto w-full px-4 md:px-12 py-8 flex flex-col justify-center space-y-30">
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
        </div>
        
      </div>    
      </div>
      
      <section className="h-screen ">

        {loadingFeatured && <p className="text-white">Cargando destacados...</p>}
        {errorFeatured && <p className="text-red-400">No se pudieron cargar los destacados.</p>}
        {!loadingFeatured && !errorFeatured && featuredProducts.length > 0 && (
          <FeaturedProducts products={featuredProducts} />
        )}
      </section>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
        <div className="relative w-full py-16 px-4 bg-gradient-to-b from-black via-[#0a0a0a] to-black overflow-hidden">
          {/* Título */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-haze font-bold text-white bg-clip-text text-transparent mb-3 tracking-widest">
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
          
      <style>{`
        @keyframes marqueeScroll {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
        }

        .marquee-inner {
            animation: marqueeScroll 25s linear infinite;
        }

        .marquee-reverse {
            animation-direction: reverse;
        }

        .marquee-inner:hover {
            animation-play-state: paused;
        }
    `}</style>
    <div className="w-full my-20">
    {/* Header Section - CON padding */}
    <div className="flex flex-col items-start px-8 md:px-16 lg:px-24 text-sm max-w-6xl mx-auto mb-12">
        <div className="flex items-center mr-auto gap-2 text-indigo-400 bg-indigo-950/50 rounded-full px-3 py-1 border border-indigo-800/30">
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.613 8.2a.62.62 0 0 1-.553-.341.59.59 0 0 1 .076-.637l6.048-6.118a.31.31 0 0 1 .375-.069c.061.033.11.084.137.147a.3.3 0 0 1 .014.197L6.537 4.991a.59.59 0 0 0 .07.552.61.61 0 0 0 .504.257h4.276a.62.62 0 0 1 .553.341.59.59 0 0 1-.076.637l-6.048 6.119a.31.31 0 0 1-.375.067.295.295 0 0 1-.15-.344l1.172-3.61a.59.59 0 0 0-.07-.553.61.61 0 0 0-.504-.257z" 
                    stroke="currentColor" strokeMiterlimit="5.759" strokeLinecap="round" />
            </svg>
            <span className="font-medium">Testimonios</span>
        </div>
        
        <h1 className="text-3xl md:text-6xl font-medium bg-gradient-to-r from-slate-100 to-slate-400 text-transparent bg-clip-text mt-4">
            La mejor prueba es la experiencia de nuestros usuarios.
        </h1>
        
        <p className="text-slate-400 mt-4 md:text-lg sm:text-md max-w-2xl">
            La mejor prueba es la experiencia de nuestros usuarios.
Si nuestro servicio cumplió tus expectativas, déjanos una reseña y ayúdanos a seguir mejorando.
        </p>
    </div>

    {/* Marquee Container - CON padding */}
    <div className="px-8 md:px-16 lg:px-24">
        <div className="marquee-row w-full mx-auto max-w-5xl overflow-hidden relative rounded-t-md mt-8">
            <div className="absolute left-0 top-0 h-full w-20 md:w-32 z-10 pointer-events-none bg-gradient-to-r from-[#121212] to-transparent"></div>
            <div className="marquee-inner flex transform-gpu min-w-[200%] py-5">
                {[...cardsData, ...cardsData].map((card, index) => (
                    <CreateCard key={index} card={card} />
                ))}
            </div>
            <div className="absolute right-0 top-0 h-full w-20 md:w-32 z-10 pointer-events-none bg-gradient-to-l from-[#121212] to-transparent"></div>
        </div>

        <div className="marquee-row w-full mx-auto max-w-5xl overflow-hidden relative rounded-b-md">
            <div className="absolute left-0 top-0 h-full w-20 md:w-32 z-10 pointer-events-none bg-gradient-to-r from-[#121212] to-transparent"></div>
            <div className="marquee-inner marquee-reverse flex transform-gpu min-w-[200%] py-5">
                {[...cardsData, ...cardsData].map((card, index) => (
                    <CreateCard key={index} card={card} />
                ))}
            </div>
            <div className="absolute right-0 top-0 h-full w-20 md:w-32 z-10 pointer-events-none bg-gradient-to-l from-[#121212] to-transparent"></div>
        </div>
    </div>
</div>
    </>
    )
}    

export default Home;