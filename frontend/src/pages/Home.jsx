
import React, { useState, useEffect, useRef,useMemo } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { ChevronLeft, ChevronRight,ShoppingCart } from "lucide-react";
import { getFeaturedProducts } from "../services/productService";
import FeaturedProducts from "../components/ui/FeaturedProducts";
import CatalogSection from '../components/ui/CatalogSection';
import { ThreeDMarquee } from "@/components/ui/3d-marquee-copy";


import 'react-lazy-load-image-component/src/effects/blur.css'; 
import fondo from "../assets/fondogradient.png";
import buff from "../assets/Buff1.png";
import store from "../assets/Store.png";
import { useNavigate } from 'react-router-dom';
import buffarcade from "../assets/BuffArcade.png";
import logosimple from "../assets/BLogo4k-white.png";
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
      
      const rawImages = products
      .map((p) => p.displayImageUrl)
      .filter((url) => typeof url === 'string' && url.trim() !== '');

      let marqueeImages = [];
      if (rawImages.length > 0) {
        const minRequired = 16;
        const repeatCount = Math.ceil(minRequired / rawImages.length);
        marqueeImages = Array(repeatCount).fill(rawImages).flat();
      }

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

      

    
    const CreateCard = ({ card }) => (
    <div className="p-10 rounded-[20px] mx-2 w-72 shrink-0
        bg-white/10 backdrop-blur-xl border border-white/20
        shadow-[0_0_20px_rgba(0,0,0,0.4)]
        transition-all duration-200 hover:scale-105 hover:border-white/30 hover:shadow-[0_0_24px_rgba(255,19,122,0.35)]">
 
        <div className="flex gap-2">
            <img className="size-11 rounded-full border border-white/20" src={card.image} alt="User Image" />
            <div className="flex flex-col">
                <div className="flex items-center gap-1">
                    <p className="font-Urbanist font-medium text-white">{card.name}</p>
                    <svg className="mt-0.5" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M4.555.72a4 4 0 0 1-.297.24c-.179.12-.38.202-.59.244a4 4 0 0 1-.38.041c-.48.039-.721.058-.922.129a1.63 1.63 0 0 0-.992.992c-.071.2-.09.441-.129.922a4 4 0 0 1-.041.38 1.6 1.6 0 0 1-.245.59 3 3 0 0 1-.239.297c-.313.368-.47.551-.56.743-.213.444-.213.96 0 1.404.09.192.247.375.56.743.125.146.187.219.24.297.12.179.202.38.244.59.018.093.026.189.041.38.039.48.058.721.129.922.163.464.528.829.992.992.2.071.441.09.922.129.191.015.287.023.38.041.21.042.411.125.59.245.078.052.151.114.297.239.368.313.551.47.743.56.444.213.96.213 1.404 0 .192-.09.375-.247.743-.56.146-.125.219-.187.297-.24.179-.12.38-.202.59-.244a4 4 0 0 1 .38-.041c.48-.039.721-.058.922-.129.464-.163.829-.528.992-.992.071-.2.09-.441.129-.922a4 4 0 0 1 .041-.38c.042-.21.125-.411.245-.59.052-.078.114-.151.239-.297.313-.368.47-.551.56-.743.213-.444.213-.96 0-1.404-.09-.192-.247-.375-.56-.743a4 4 0 0 1-.24-.297 1.6 1.6 0 0 1-.244-.59 3 3 0 0 1-.041-.38c-.039-.48-.058-.721-.129-.922a1.63 1.63 0 0 0-.992-.992c-.2-.071-.441-.09-.922-.129a4 4 0 0 1-.38-.041 1.6 1.6 0 0 1-.59-.245A3 3 0 0 1 7.445.72C7.077.407 6.894.25 6.702.16a1.63 1.63 0 0 0-1.404 0c-.192.09-.375.247-.743.56m4.07 3.998a.488.488 0 0 0-.691-.69l-2.91 2.91-.958-.957a.488.488 0 0 0-.69.69l1.302 1.302c.19.191.5.191.69 0z" fill="#00FF37" />
                    </svg>
                </div>
                <span className="text-xs font-Urbanist text-white/40">{card.handle}</span>
            </div>
        </div>
 
        <p className="text-sm py-4 font-Urbanist text-white/70 leading-relaxed">
            Radiant made undercutting all of our competitors an absolute breeze.
        </p>
 
        <div className="flex items-center justify-between font-Urbanist text-white/40 text-xs">
            <div className="flex items-center gap-1">
                <span>Posted on</span>
                <a href="https://x.com" target="_blank" className="transition-colors hover:text-[#00FF37]">
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
        className="relative flex min-h-screen w-full items-center justify-end overflow-hidden bg-cover bg-center bg-no-repeat flex-col mb-8"
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
      
      <section className="h-screen mb-14">

        {loadingFeatured && <p className="text-white">Cargando destacados...</p>}
        {errorFeatured && <p className="text-red-400">No se pudieron cargar los destacados.</p>}
        {!loadingFeatured && !errorFeatured && featuredProducts.length > 0 && (
          <FeaturedProducts products={featuredProducts} />
        )}
      </section>
        

        <CatalogSection
          products={products}
          handleProductClick={handleProductClick}
          onViewAll={() => navigate('/productos')}
        />

        
      
      <div className="relative mx-auto my-10 flex h-auto sm:h-screen w-full flex-col items-center justify-center overflow-hidden rounded-3xl px-4 py-16 sm:px-6"  
      style={{ fontFamily: '"Urbanist", sans-serif' }}>
        <h2 className="font-haze-defog relative z-20 mx-auto max-w-7xl text-center text-xl leading-snug tracking-wide [-webkit-text-stroke:0.5px_#ff137a] sm:[-webkit-text-stroke:1px_#ff137a] text-balance text-[#ff147a]/40 sm:text-4xl sm:tracking-widest md:text-7xl lg:text-8xl">
          Una nueva forma de vivir la  {" "}
          <span className="relative z-20 inline-block rounded-xl bg-[#00FF37]/20 px-3 py-0.5 sm:px-4 sm:py-1 text-[#00FF37]/40 underline [-webkit-text-stroke:0.5px_#00FF37] sm:[-webkit-text-stroke:1px_#00FF37] decoration-[#00FF37]/70 decoration-[3px] sm:decoration-[6px] underline-offset-[8px] sm:underline-offset-[16px] backdrop-blur-sm">
            experiencia
          </span>{" "}
          gamer.
        </h2>
        <p className="relative z-20 mx-auto max-w-4xl py-5 sm:py-8 text-center text-xs sm:text-sm text-neutral-200 md:text-2xl">
            Buff Store combina tecnología moderna, seguridad y un diseño intuitivo para ofrecerte una
            experiencia rápida, confiable y sin complicaciones. Compra tus códigos de videojuegos con total
            confianza y disfruta de soporte 24/7 para cualquier necesidad.
        </p>
          
        <div className="relative z-20 flex flex-wrap items-center justify-center gap-4 pt-2 sm:pt-4">
          <a href="/Register" className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-6 py-2.5 sm:px-8 sm:py-3 font-haze text-sm sm:text-lg tracking-widest text-white transition-colors hover:bg-white/20">
             Unise al club
          </a>
        </div>
  
        {/* overlay */}
        <div className="absolute inset-0 z-10 h-full w-full bg-black/50 " />
        <ThreeDMarquee
          className="pointer-events-none absolute inset-0 h-full w-full "
          images={marqueeImages}
        />
        
        
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
    <div className="w-full my-20 bg-black relative" style={{ fontFamily: '"Urbanist", sans-serif' }}>
      
      <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
    <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />
 
    <div className="relative z-10">
    {/* Header Section - CON padding */}
    <div className="flex flex-col items-start px-8 md:px-16 lg:px-24 text-sm max-w-6xl mx-auto mb-12">
        <div className="flex items-center mr-auto gap-2 text-[#00ff37] bg-[#00ff37]/20 rounded-full px-3 py-1 border border-[#00ff37]">
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
        <div className="marquee-row w-full mx-auto max-w-7xl overflow-hidden relative rounded-t-md mt-8">
            <div className="absolute left-0 top-0 h-full w-20 md:w-32 z-10 pointer-events-none bg-gradient-to-r from-[#000000] to-transparent"></div>
            <div className="marquee-inner flex transform-gpu min-w-[200%] py-5">
                {[...cardsData, ...cardsData].map((card, index) => (
                    <CreateCard key={index} card={card} />
                ))}
            </div>
            <div className="absolute right-0 top-0 h-full w-20 md:w-32 z-10 pointer-events-none bg-gradient-to-l from-[#000000] to-transparent"></div>
        </div>

        <div className="marquee-row w-full mx-auto max-w-7xl overflow-hidden relative rounded-b-md">
            <div className="absolute left-0 top-0 h-full w-20 md:w-32 z-10 pointer-events-none bg-gradient-to-r from-[#000000] to-transparent"></div>
            <div className="marquee-inner marquee-reverse flex transform-gpu min-w-[200%] py-5">
                {[...cardsData, ...cardsData].map((card, index) => (
                    <CreateCard key={index} card={card} />
                ))}
            </div>
            <div className="absolute right-0 top-0 h-full w-20 md:w-32 z-10 pointer-events-none bg-gradient-to-l from-[#000000] to-transparent"></div>
        </div>
      </div>
    </div>
    
</div>
    </>
    )
}    

export default Home;