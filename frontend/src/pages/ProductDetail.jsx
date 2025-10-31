import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProductDetail = () => {
  const { id } = useParams(); // Obtener el ID del producto desde la URL
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);

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
      return null;
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
      displayImageUrl: getProductImage()
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

  // Función para obtener la imagen del producto
  const getProductImage = (index = 0) => {
    if (!product?.images || product.images.length === 0) return null;
    
    if (typeof product.images[index] === 'string') {
      // URL de Google Cloud Storage
      return product.images[index];
    } else if(apiData?.image) {
        return apiData.image;
    } else if (apiData?.background_image) {
        return apiData.background_image;
    }   

    return null;
  };

  // Renderizar galería de imágenes
  const renderImageGallery = () => {
    if (!product?.images || product.images.length === 0) {
      return (
        <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-500">Sin imágenes disponibles</span>
        </div>
      );
    }

    const mainImage = getProductImage(selectedImageIndex);

    return (
      <div className="space-y-4">
        {/* Imagen principal */}
        <div className="aspect-square overflow-hidden rounded-3xl bg-gray-200">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Main image failed to load:', mainImage);
                e.target.src = '/path/to/placeholder.jpg';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Imagen no disponible</span>
            </div>
          )}
        </div>

        {/* Miniaturas */}
        {product.images.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto">
            {product.images.map((_, index) => {
              const thumbnailUrl = getProductImage(index);
              return (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                    selectedImageIndex === index ? 'border-blue-500' : 'border-gray-300'
                  }`}
                >
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200"></div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
  function formatDescription(html) {
  // Paso 1: Normalizar subtítulos h2 y h3 → añadir clases Tailwind
  let formatted = html
    .replace(
      /<h2>/gi,
      '<h2 class="text-2xl mt-6 mb-2 text-black ">'
    )
    .replace(/<\/h2>/gi, "</h2>")
    .replace(
      /<h3>/gi,
      '<h3 class="text-2xl mt-6 mb-2 text-black ">'
    )
    .replace(/<\/h3>/gi, "</h3>");

  // Paso 2: Detectar subtítulos cortos en <p> y convertirlos a h3 estilizados
  formatted = formatted.replace(
    /<p>([^<]{1,20})<\/p>/gi,
    '<h3 class="text-2xl  mt-6 mb-2 text-black">$1</h3>'
  );

  return formatted;
}

  return (
    <div className="min-h-screen bg-transparent py-8 pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="mb-8">
          <button 
            onClick={() => navigate('/')}
            className="bg-[#FF0099] text-white font-medium text-1xl shadow-lg shadow-[#FF0099]/30 hover:shadow-[#FF0099]/50 rounded-lg px-4 py-2"
          >
            ← Volver a productos
          </button>   
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Galería de imágenes */}
          <div>
            {renderImageGallery()}
          </div>

          {/* Información del producto */}
          <div className="space-y-6 bg-white/65 backdrop-blur-xl p-6 rounded-2xl border border-white/25 shadow-xl ring-1 ring-white/10">

            
            {/* Título y precio */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              
              {product.category && (
                <span className="inline-block px-3 py-1 text-sm text-white rounded-lg bg-[#FF0099] mb-4 shadow-lg shadow-[#FF0099]/30 hover:shadow-[#FF0099]/50">
                  {product.category}
                </span>
              )}
              
              <div className="text-3xl font-bold text-[#00FF66]/70 mb-4">
                ${Number(product.price).toLocaleString('en-US')}
              </div>
              
              {product.stock > 0 ? (
                <p className="text-[#00FF66] font-medium">
                  ✓ En stock ({product.stock} disponibles)
                </p>
              ) : (
                <p className="text-red-600 font-medium">
                  ✗ Agotado
                </p>
              )}
            </div>

            {/* Descripción */}
            {product.description && (
              <div>
                <h3 className="text-2xl mb-2">Descripción</h3>
                <div className="prose max-w-none dark:prose-invert">
                    <div
                        dangerouslySetInnerHTML={{
                        __html: formatDescription(apiData.description),
                        }}
                    />
                    </div>
              </div>
            )}

            {/* Información de la API */}
            {apiData && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalles del juego</h3>
                
                {apiData.rating && (
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-medium">{apiData.rating}/5</span>
                    <span className="text-gray-500">({apiData.ratings_count} reseñas)</span>
                  </div>
                )}
                
                {apiData.genres && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Géneros:</p>
                    <div className="flex flex-wrap gap-2">
                      {apiData.genres.map(genre => (
                        <span key={genre.id} className="px-2 py-1 bg-[#00FF66]/70 hover:bg-[#00CC52] text-black font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-[#00FF66]/30 hover:shadow-[#00FF66]/50">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {apiData.released && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Lanzamiento:</span> {apiData.released}
                  </p>
                )}
                
                {apiData.developers && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Desarrollador:</span> {apiData.developers[0]?.name}
                  </p>
                )}
              </div>
            )}

            {/* Controles de compra */}
            {product.stock > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Cantidad:</label>
                  <select 
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-1"
                  >
                    {Array.from({length: Math.min(product.stock, 10)}, (_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  className="w-full py-3 px-6 text-white font-medium rounded-lg bg-[#FF0099] hover:bg-[#CC0077] transition-all duration-200 shadow-lg shadow-[#FF0099]/30 hover:shadow-[#FF0099]/50"
                >
                  Agregar al carrito
                </button>
              </div>
            )}

            {/* Información adicional */}
            <div className="border-t pt-6 space-y-2">
              {product.brand && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Marca:</span> {product.brand}
                </p>
              )}
              {product.code && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Código:</span> {product.code}
                </p>
              )}
              {product.taxRate && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">IVA:</span> {product.taxRate}%
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-green-500 text-4xl mb-4">✓</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                ¡Producto agregado al carrito!
              </h2>
              <p className="text-gray-600 mb-6">
                {product.name} se ha agregado exitosamente
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Seguir comprando
                </button>
                <button
                  onClick={() => navigate('/cart')}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Ver carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;