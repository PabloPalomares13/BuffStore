import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  X,  Image as ImageIcon, ChevronDown, Bold, Italic, Underline, Link, ListOrdered, ListTree, AlignLeft,
  CheckCircle, AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'

const Modproducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Form state
  const [productData, setProductData] = useState({
    name: '',
    code: '',
    description: '',
    price: '',
    stock: '',
    taxRate: '',
    category: '',
    tags: '',
    brand: '',
    vendor: '',
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImages, setCurrentImages] = useState([]);
  
  
  useEffect(() => {
    if (id) {
      fetchProductDetails();
    } else {
      setLoading(false);
    }
  }, [id]);
  
  const fetchProductDetails = async () => {
  try {
    const response = await fetch(`${link}/api/products/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener los detalles del producto');
    }
    const data = await response.json();
    
    console.log('Product data:', data); // Debug
    console.log('Product images:', data.images); // Debug
    
    // Initialize form with product data
    setProductData({
      name: data.name || '',
      code: data.code || '',
      description: data.description || '',
      price: data.price || '',
      stock: data.stock || '',
      taxRate: data.taxRate || '',
      category: data.category || '',
      tags: data.tags || '',
      brand: data.brand || '',
      vendor: data.vendor || ''
    });
    
    if (data.images && data.images.length > 0) {
      // Verificar si las imágenes son URLs de GCS o formato binario
      if (typeof data.images[0] === 'string') {
        // Nuevo formato: URLs directas de Google Cloud Storage
        setCurrentImages(data.images);
        setSelectedImage(data.images[0]); // Mostrar la primera imagen
        console.log('Using GCS URL:', data.images[0]);
      } else if (data.images[0].data) {
        // Formato antiguo: imágenes binarias en MongoDB
        setCurrentImages(data.images);
        const imageUrl = `${link}/api/products/image/${data._id}/0`;
        setSelectedImage(imageUrl);
        console.log('Using binary format URL:', imageUrl);
      }
    } else {
      console.log('Imagen no encontrada');
      setCurrentImages([]);
      setSelectedImage(null);
    }
    
    setLoading(false);
  } catch (err) {
    console.error('Error fetching product:', err);
    setError(err.message);
    setLoading(false);
  }
};
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "price") {
      const rawValue = value.replace(/\D/g, "");
      const formattedValue = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      setProductData({ ...productData, [name]: rawValue });
      e.target.value = formattedValue;
      return;
    }

    if (name === "taxRate") {
      const onlyNumbers = value.replace(/\D/g, "");
      if (onlyNumbers === "") {
        setProductData({ ...productData, [name]: "" });
        return;
      }
      const numericValue = parseInt(onlyNumbers, 10);
      if (numericValue > 100) {
        setAlert({ show: true, type: "error", message: "La tasa de impuesto no puede ser mayor a 100%" });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
        return;
      }
      setProductData({ ...productData, [name]: onlyNumbers });
      return;
    }

    if (name === "stock" || name === "code") {
      const onlyNumbers = value.replace(/\D/g, "");
      if (value !== onlyNumbers) {
        setAlert({ show: true, type: "error", message: `El campo ${name} solo puede contener números` });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
        return;
      }
      setProductData({ ...productData, [name]: value });
      return;
    }

    setProductData({ ...productData, [name]: value });
  };
  
  const handleImageChange = (e) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    setSelectedImage(URL.createObjectURL(file));
    
    setProductData(prev => ({
      ...prev,
      newImage: file
    }));
    
    console.log('New image selected:', file.name);
  }
};
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('userToken');
    try {
      const formData = new FormData();
      

      Object.keys(productData).forEach(key => {
        if (key !== 'newImage') {
          formData.append(key, productData[key]);
        }
      });
      

      if (productData.newImage) {
        formData.append('images', productData.newImage);
      }
      
      const response = await fetch(`${link}/api/products/${id}`, {
        method: 'PUT',
        headers: {
        'Authorization': `Bearer ${token}` // ✅ Enviamos el token aquí
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar el producto');
      }
      
      Swal.fire({
        title: '¡Éxito!',
        text: 'Producto actualizado correctamente',
        icon: 'success',
        confirmButtonText: 'Ok'
      }).then(() => {

        navigate('/listaproductos');
      });
      
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    }
  };
  
  const handleCancel = () => {
    // Redirect back to product list
    navigate('/listaproductos');
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando detalles del producto...</div>;
  }
  
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }
  
  return (
    <main className="flex-1 overflow-y-auto p-6 bg-transparent">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{id ? 'Modificación del Producto' : 'Nuevo Producto'}</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg border border-white/40 p-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-800">Información Básica</h2>
              <p className="text-sm text-gray-600 mb-6">Sección para modificar información del producto</p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={productData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                    placeholder="Nombre"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={productData.code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                    placeholder="Código"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <div className="bg-white/70 rounded-lg border border-gray-300">
                    <div className="flex items-center border-b border-gray-300 px-3 py-2 gap-2">
                      <button type="button" className="p-1 rounded hover:bg-gray-100">
                        <Bold size={16} />
                      </button>
                      <button type="button" className="p-1 rounded hover:bg-gray-100">
                        <Italic size={16} />
                      </button>
                      <button type="button" className="p-1 rounded hover:bg-gray-100">
                        <Underline size={16} />
                      </button>
                      <button type="button" className="p-1 rounded hover:bg-gray-100">
                        <Link size={16} />
                      </button>
                      <div className="h-4 w-px bg-gray-300 mx-1"></div>
                      <button type="button" className="p-1 rounded hover:bg-gray-100">
                        <ListOrdered size={16} />
                      </button>
                      <button type="button" className="p-1 rounded hover:bg-gray-100">
                        <ListTree size={16} />
                      </button>
                      <button type="button" className="p-1 rounded hover:bg-gray-100">
                        <AlignLeft size={16} />
                      </button>
                    </div>
                    <textarea
                      id="description"
                      name="description"
                      value={productData.description}
                      onChange={handleInputChange}
                      rows="6"
                      className="w-full px-4 py-2 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent border-none"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pricing Card */}
            <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg border border-white/40 p-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-800">Precios y Stock</h2>
                <p className="text-sm text-gray-600 mb-6">Sección para configurar información de ventas del producto</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="text"
                        id="price"
                        name="price"
                        max="9999999"
                        value={(productData.price).toLocaleString('en-US')}
                        onChange={handleInputChange}
                        className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock Disponible</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">#</span>
                      </div>
                      <input
                        type="text"
                        id="stock"
                        name="stock"
                        value={productData.stock}
                        onChange={handleInputChange}
                        className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">Tasa de Impuesto (%)</label>
                    <input
                      type="text"
                      id="taxRate"
                      name="taxRate"
                      value={productData.taxRate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            
            {/* Organization Card */}
            <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg border border-white/40 p-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-800">Organización</h2>
              <p className="text-sm text-gray-600 mb-6">Sección para modificar los atributos del producto</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <div className="relative">
                  <select
                      id="category"
                      name="category"
                      value={productData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 appearance-none"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Acción">Acción</option>
                      <option value="Aventura">Aventura</option>
                      <option value="Terror">Terror</option>
                      <option value="Deportes">Deportes</option>
                      <option value="Estrategia">Estrategia</option>
                      <option value="Disparos">Disparos</option>
                      <option value="Otro">Otro</option>
                  </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDown size={16} className="text-gray-500" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Etiquetas</label>
                  <div className="relative">
                    <select
                      id="tags"
                      name="tags"
                      value={productData.tags}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 appearance-none"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Nuevo">Nuevo</option>
                      <option value="Oferta">Oferta</option>
                      <option value="Destacado">Destacado</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDown size={16} className="text-gray-500" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={productData.brand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                    placeholder="Marca"
                  />
                </div>
                
                <div>
                  <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                  <input
                    type="text"
                    id="vendor"
                    name="vendor"
                    value={productData.vendor}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                    placeholder="Proveedor"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Product Image */}
          <div className="lg:col-span-1">
            <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg border border-white/40 p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-800">Imagen del Producto</h2>
              <p className="text-sm text-gray-600 mb-6">Agregue o cambie la imagen del producto</p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-white/50 hover:bg-white/70 transition-colors">
                {selectedImage ? (
                  <div className="relative w-full">
                    <img 
                      src={selectedImage} 
                      alt="Product preview" 
                      className="rounded-lg mx-auto object-contain max-h-48"
                    />
                    <button 
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon size={48} className="text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-1">Arrastre su imagen aquí, o</p>
                    <label htmlFor="fileUpload" className="cursor-pointer">
                      <span className="text-blue-500 hover:text-blue-600 text-sm">explorar</span>
                      <input 
                        id="fileUpload"
                        type="file"
                        className="hidden"
                        onChange={handleImageChange}
                        accept=".jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-4">Formatos permitidos: jpeg, png</p>
                  </>
                )}
              </div>

              <div className="mt-6 flex flex-col space-y-4">
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white py-2 px-4 rounded-lg shadow transition-all duration-300"
                >
                  Guardar Producto
                </button>
                <button 
                  type="button"
                  onClick={handleCancel}
                  className="w-full bg-transparent hover:bg-gray-100 text-gray-700 py-2 px-4 rounded-lg border border-gray-300 transition-all duration-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
};
    
export default Modproducto;