import React, { useState } from 'react';

import { 
   X,  Image as ImageIcon, ChevronDown, Bold, Italic, Underline, Link, ListOrdered, ListTree, AlignLeft,
   CheckCircle, AlertCircle
} from 'lucide-react';

const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'
const NewProduct = () => {
  
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
  
  const [imageFile, setImageFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  
  
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
      setImageFile(e.target.files[0]);
      setSelectedImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async () => {
  const formData = new FormData();
  for (const key in productData) {
    formData.append(key, productData[key]);
  }
  if (imageFile) {
    formData.append('images', imageFile);
  }

  const token = localStorage.getItem('userToken'); // ✅ Obtenemos el token

  try {
    const res = await fetch(`${link}/api/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}` // ✅ Enviamos el token aquí
      },
      body: formData
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
      }
      if (res.status === 403) {
        throw new Error('Acceso denegado: solo administradores pueden crear productos.');
      }
      throw new Error('Error al guardar el producto.');
    }

    setAlert({ show: true, type: 'success', message: '✅ Producto guardado exitosamente' });


    setProductData({
      name: '', code: '', description: '', price: '', stock: '', taxRate: '',
      category: '', tags: '', brand: '', vendor: ''
    });
    setImageFile(null);
    setSelectedImage(null);
  } catch (error) {
    setAlert({
      show: true,
      type: 'error',
      message: `⚠️ ${error.message}`
    });
  } finally {
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 2000);
  }
};
  
  return (
    <main className="flex-1 overflow-y-auto p-6 bg-transparent relative">
          
          {alert.show && (
            <div 
              className={`fixed top-6 right-6 z-50 flex items-center rounded-lg shadow-lg border px-8 py-6 transition-all duration-300 transform mt-18 ${
                alert.type === 'success' 
                ? 'bg-green-50 border-green-100 text-green-800' 
                : 'bg-red-50 border-red-100 text-red-800'
              } animate-in slide-in-from-right`}
              style={{
                maxWidth: '320px',
                animationDuration: '0.5s',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div className="flex-shrink-0 mr-3">
                {alert.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {alert.message}
                </p>
              </div>
              <button 
                onClick={() => setAlert({ show: false, type: '', message: '' })} 
                className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Nuevo Producto</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information Card */}
              <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg border border-white/40 p-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-800">Información Básica</h2>
                <p className="text-sm text-gray-600 mb-6">Sección para configurar información básica del producto</p>
                
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
                        <button className="p-1 rounded hover:bg-gray-100">
                          <Bold size={16} />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-100">
                          <Italic size={16} />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-100">
                          <Underline size={16} />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-100">
                          <Link size={16} />
                        </button>
                        <div className="h-4 w-px bg-gray-300 mx-1"></div>
                        <button className="p-1 rounded hover:bg-gray-100">
                          <ListOrdered size={16} />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-100">
                          <ListTree size={16} />
                        </button>
                        <button className="p-1 rounded hover:bg-gray-100">
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
                        placeholder='¡Se trata de explorar!
                        Hay infinitas posibilidades de lo que puedes crear con la clave de Minecraft Java & Bedrock Edition (PC) en tus manos. ¡Combina diferentes materiales y crea elementos para construir, sobrevivir, cazar y luchar! Además, el juego ofrece numerosos modos diferentes para garantizarte una experiencia inolvidable. Con la clave de Minecraft Java & Bedrock Edition (PC), podrás sumergirte en múltiples desafíos fascinantes. Todo el contenido enumerado a continuación está a tu disposición para explorar al máximo en modo de un jugador:
                        • Modo supervivencia: empieza con las manos vacías y tendrás que crear tu propio refugio, protección y todo a tu alrededor desde cero.
                        • Supervivencia extrema: lleva la supervivencia un paso más allá, donde tienes solo una vida y, al morir, todo lo creado se pierde.
                        • Modo creativo: desata tu talento con recursos ilimitados al instante, inmortalidad ¡y hasta la capacidad de volar!
                        • Modo espectador fantasma: eres solo un alma errante, intocable e inofensiva, pero equipada con un ojo todo lo ve y todo lo sabe.
                        '
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
                        value={Number(productData.price).toLocaleString('en-US')}
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
              
              
              <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg border border-white/40 p-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-800">Organización</h2>
                <p className="text-sm text-gray-600 mb-6">Sección para configurar los atributos del producto</p>
                
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
                        <option value="Accion">Accion</option>
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
                    <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Desarrollador</label>
                    <input
                      type="text"
                      id="brand"
                      name="brand"
                      value={productData.brand}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                      placeholder="Desarrollador del producto"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-1">Distribuidor</label>
                    <input
                      type="text"
                      id="vendor"
                      name="vendor"
                      value={productData.vendor}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70"
                      placeholder="Distribuidor del producto"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            
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
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white py-2 px-4 rounded-lg shadow transition-all duration-300"
                  >
                    Guardar Producto
                  </button>
                  <button className="w-full bg-transparent hover:bg-gray-100 text-gray-700 py-2 px-4 rounded-lg border border-gray-300 transition-all duration-300">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
  );
};
    
export default NewProduct;