import imghome from "../assets/imghome.png";
import React, { useState, useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css'; 

import { useNavigate } from 'react-router-dom';
const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'

const logos = [
    {
      name: 'Vercel',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Rockstar_Games_Logo.svg/250px-Rockstar_Games_Logo.svg.png',
    },
    {
      name: 'Nextjs',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Ubisoft_logo.svg/250px-Ubisoft_logo.svg.png',
    },
    {
      name: 'Prime',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/EA_Sports_monochrome_logo.svg/250px-EA_Sports_monochrome_logo.svg.png',
    },
    {
      name: 'Trustpilot',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Activision.svg/250px-Activision.svg.png',
    },
    {
      name: 'Webflow',
      url: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5b/Riot_Games_2022.svg/250px-Riot_Games_2022.svg.png',
    },
  
    {
      name: 'Airbnb',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Epic_Games_logo.svg/100px-Epic_Games_logo.svg.png',
    },
    {
      name: 'Tina',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/250px-Sony_logo.svg.png',
    },
  ]
  
  const Home = () => {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    
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
    
    setProducts(productsWithImages || []);
    setLoading(false);
    
  } catch (err) {
    console.error(err);
    setLoading(false);
  }
};
      useEffect(() => {
        fetchProducts();
      }, []);

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
    return (
    <>  
        
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 mx-auto max-w-7xl pt-32 sm:pt-32 md:pt-24 lg:pt-36 mb-32">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 lg:gap-16">
                <div className="w-full md:w-1/2 lg:w-5/12">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-[#DFE8D8] font-extrabold leading-tight sm:text-center text-center">
                        Busca, Compra y Disfruta
                    </h1>
                    <div className="mt-4 sm:mt-6">
                        <h2 
                            className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text text-center "
                            style={{
                                backgroundImage: 'linear-gradient(90deg, rgba(189, 157, 212, 1) 0%, rgba(150, 217, 210, 1) 99%)'
                            }}
                        >
                            La Plataforma de venta de codigos para videojuegos y microtransacciones mas confiable del mercado
                        </h2>
                    </div>
                    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4">
                        <button className="w-full sm:w-auto px-6 py-3 bg-[#0C9C97] text-white font-bold rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-700 transition-colors">
                            Busca Ahora
                        </button>
                    </div>
                </div>
                <div className="w-full md:w-1/2 lg:w-7/12 mt-8 md:mt-0">
                    <img 
                        className="w-full h-auto object-cover rounded-xl shadow-lg" 
                        src={imghome} 
                        alt="Plataforma de videojuegos" 
                        role="img" 
                    />
                </div>
            </div>
        </div>

        
        <div className="w-full py-12 bg-white/20 mb-22">
            <div className="mx-auto w-full px-4 md:px-8">
                <div
                className="group relative mt-6 flex gap-6 overflow-hidden p-2"
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
                        className="flex shrink-0 animate-logo-cloud flex-row justify-around gap-6"
                    >
                        {logos.map((logo, key) => (
                        <div 
                            key={key} 
                            className="flex items-center justify-center bg-transparent p-2"
                            style={{
                                width: "180px",
                                height: "80px"
                            }}
                        >
                            <div className="relative w-full h-full">
                                <img
                                    src={logo.url}
                                    alt={`${logo.name}`}
                                    className="absolute top-0 left-0 right-0 bottom-0 m-auto max-w-full max-h-full object-contain "
                                />
                            </div>
                        </div>
                        ))}
                    </div>
                    ))}
                </div>
            </div>
        </div>
        
        <div className="px-4">
          <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-center font-quantico text-[#DFE8D8]">
            Recomendados para ti
          </h1>
        </div>        

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="py-20 px-4 grid grid-cols-1 sm:max-sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center gap-y-20 gap-x-14 mt-10 mb-5">
  {products.map(product => (
    <div 
      key={product._id} 
      className="w-86 h-130 bg-white/85 rounded-xl shadow-lg border border-white/10 duration-500 hover:scale-105 hover:shadow-xl cursor-pointer"
      onClick={() => handleProductClick(product._id)} // Hacer clickeable toda la card
    >
      {product.displayImageUrl ? (
        <img 
          src={product.displayImageUrl} 
          alt={product.name} 
          className="h-80 w-full object-cover rounded-t-xl"
          onError={(e) => {
            console.error('Image failed to load:', product.displayImageUrl);
            if (!e.target.src.includes('/api/products/image/')) {
              e.target.src = `${link}/api/products/image/${product._id}/0`;
            }
          }}
        />
      ) : (
        <div className="h-80 w-full bg-gray-200 rounded-t-xl flex items-center justify-center">
          <span className="text-gray-500">No image available</span>
        </div>
      )}
      
      <div className="p-4">
        <span className="inline-block px-3 py-1 text-xs text-white rounded-lg bg-[#E39F71] mb-2"> 
          {product.tags || product.category}
        </span>
        <h3 className="text-lg font-semibold text-gray-800 mb-1 font-bold">{product.name}</h3>
        <div className="text-lg font-semibold text-black cursor-auto my-3">
          ${Number(product.price).toLocaleString('en-US')}
        </div>
        <button 
          id="agregarAlCarrito"
          style={{ backgroundImage: "linear-gradient(90deg,rgba(189, 157, 212, 1) 0%, rgba(125, 209, 199, 1) 99%)"}}
          className="w-full py-2 px-4 text-white rounded-full hover:opacity-90 transition-opacity duration-300"
          onClick={(e) => {
            e.stopPropagation(); // Evitar que se active el click del card
            handleAddToCart(product);
          }}
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  ))}
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
        

    </>
    )
}    

export default Home;