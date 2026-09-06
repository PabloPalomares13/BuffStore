import React, { useState } from 'react';

import { 
   X,Upload,  Image as ImageIcon,Video, ChevronDown, Bold, Italic, Underline, Link, ListOrdered, ListTree, AlignLeft,
   CheckCircle, AlertCircle, Loader2
} from 'lucide-react';

const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'
const NewProduct = () => {
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
  
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [videoProcessFlags, setVideoProcessFlags] = useState([]);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    const files = Array.from(e.target.files);
    
    if (imageFiles.length + files.length > 10) {
      setAlert({ show: true, type: "error", message: "Máximo 10 imágenes permitidas" });
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setAlert({ show: true, type: "error", message: `${file.name} no es una imagen válida` });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setAlert({ show: true, type: "error", message: `${file.name} excede el tamaño máximo de 5MB` });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
        return false;
      }
      return true;
    });

    setImageFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (videoFiles.length + files.length > 2) {
      setAlert({ show: true, type: "error", message: "Máximo 2 videos permitidos" });
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('video/')) {
        setAlert({ show: true, type: "error", message: `${file.name} no es un video válido` });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
        return false;
      }
      if (file.size > 100 * 1024 * 1024) {
        setAlert({ show: true, type: "error", message: `${file.name} excede el tamaño máximo de 100MB` });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
        return false;
      }
      return true;
    });

    setVideoFiles(prev => [...prev, ...validFiles]);
    setVideoProcessFlags(prev => [...prev, ...validFiles.map(() => true)]); // NUEVO
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // NUEVO
  const toggleVideoProcessing = (index) => {
    setVideoProcessFlags(prev => prev.map((flag, i) => (i === index ? !flag : flag)));
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
  setVideoFiles(prev => prev.filter((_, i) => i !== index));
  setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  setVideoProcessFlags(prev => prev.filter((_, i) => i !== index)); // NUEVO
};

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const formData = new FormData();
    for (const key in productData) {
      formData.append(key, productData[key]);
    }
    
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    videoFiles.forEach(file => {
      formData.append('videos', file);
    });

    formData.append('videoProcessFlags', JSON.stringify(videoProcessFlags));

    const token = localStorage.getItem('userToken');

    try {
      const res = await fetch(`${link}/api/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
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
      setImageFiles([]);
      setVideoFiles([]);
      setImagePreviews([]);
      setVideoPreviews([]);
      setTimeout(() => {
        navigate('/listaproductos');
      }, 2000);
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: `⚠️ ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
    }
  };
  
  return (
    <main className="flex-1 bg-transparent ">
          {alert.show && (
            <div
              className={`fixed top-6 right-6 z-50 flex items-center rounded-full backdrop-blur-md border px-8 py-6 transition-all duration-300 transform mt-18 ${
                alert.type === 'success'
                ? 'bg-black/60 border-[#00FF37]/40 text-white'
                : 'bg-black/60 border-[#FF137A]/40 text-white'
              } animate-in slide-in-from-right`}
              style={{
                maxWidth: '320px',
                animationDuration: '0.5s',
                boxShadow: alert.type === 'success'
                  ? '0 0 20px -4px rgba(0,255,55,0.4)'
                  : '0 0 20px -4px rgba(255,19,122,0.4)',
              }}
            >
              <div className="flex-shrink-0 mr-3">
                {alert.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-[#00FF37]" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#FF137A]" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium font-Urbanist">
                  {alert.message}
                </p>
              </div>
              <button
                onClick={() => setAlert({ show: false, type: '', message: '' })}
                className="flex-shrink-0 ml-3 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div
            className="relative bg-transparent backdrop-blur-md rounded-[20px] shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] shadow-[#000000]/70 p-6 overflow-hidden"
            style={{ fontFamily: '"Urbanist", sans-serif' }}
          >
            <div className="mb-6">
              <h1 className="font-haze uppercase text-2xl tracking-widest text-white">
                Nuevo <span className="text-[#00FF37]">Producto</span>
              </h1>
            </div>
            {/* Manchas de luz neón difuminadas */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />

            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">

              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information Card */}
                <div className="bg-black/40 backdrop-blur-md rounded-[20px] border border-white/20 p-6">
                  <h2 className="text-lg font-semibold mb-2 text-white">Información Básica</h2>
                  <p className="text-sm text-white/60 mb-6">Sección para configurar información básica del producto</p>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1">Nombre del Producto</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={productData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                        placeholder="Nombre"
                      />
                    </div>

                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-white/70 mb-1">Código</label>
                      <input
                        type="text"
                        id="code"
                        name="code"
                        value={productData.code}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                        placeholder="Código"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-white/70 mb-1">Descripción</label>
                      <div className="bg-white/10 rounded-[20px] border border-white/20 overflow-hidden">
                        <div className="flex items-center border-b border-white/20 px-3 py-2 gap-2">
                          <button className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
                            <Bold size={16} />
                          </button>
                          <button className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
                            <Italic size={16} />
                          </button>
                          <button className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
                            <Underline size={16} />
                          </button>
                          <button className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
                            <Link size={16} />
                          </button>
                          <div className="h-4 w-px bg-white/20 mx-1"></div>
                          <button className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
                            <ListOrdered size={16} />
                          </button>
                          <button className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
                            <ListTree size={16} />
                          </button>
                          <button className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
                            <AlignLeft size={16} />
                          </button>
                        </div>
                        <textarea
                          id="description"
                          name="description"
                          value={productData.description}
                          onChange={handleInputChange}
                          rows="6"
                          className="w-full px-4 py-2 focus:outline-none bg-transparent border-none text-white placeholder-white/40"
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
                <div className="bg-black/40 backdrop-blur-md rounded-[20px] border border-white/20 p-6">
                  <h2 className="text-lg font-semibold mb-2 text-white">Precios y Stock</h2>
                  <p className="text-sm text-white/60 mb-6">Sección para configurar información de ventas del producto</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3">

                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-white/70 mb-1">Precio</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <span className="text-white/40">$</span>
                        </div>
                        <input
                          type="text"
                          id="price"
                          name="price"
                          value={Number(productData.price).toLocaleString('en-US')}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="stock" className="block text-sm font-medium text-white/70 mb-1">Stock Disponible</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <span className="text-white/40">#</span>
                        </div>
                        <input
                          type="text"
                          id="stock"
                          name="stock"
                          value={productData.stock}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="taxRate" className="block text-sm font-medium text-white/70 mb-1">Tasa de Impuesto (%)</label>
                      <input
                        type="text"
                        id="taxRate"
                        name="taxRate"
                        value={productData.taxRate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>


                <div className="bg-black/40 backdrop-blur-md rounded-[20px] border border-white/20 p-6">
                  <h2 className="text-lg font-semibold mb-2 text-white">Organización</h2>
                  <p className="text-sm text-white/60 mb-6">Sección para configurar los atributos del producto</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-white/70 mb-1">Categoría</label>
                      <div className="relative">
                        <select
                          id="category"
                          name="category"
                          value={productData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors appearance-none"
                        >
                          <option value="" className="bg-black text-white">Seleccionar...</option>
                          <option value="Accion" className="bg-black text-white">Accion</option>
                          <option value="Aventura" className="bg-black text-white">Aventura</option>
                          <option value="Terror" className="bg-black text-white">Terror</option>
                          <option value="Deportes" className="bg-black text-white">Deportes</option>
                          <option value="Estrategia" className="bg-black text-white">Estrategia</option>
                          <option value="Disparos" className="bg-black text-white">Disparos</option>
                          <option value="Otro" className="bg-black text-white">Otro</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                          <ChevronDown size={16} className="text-white/50" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="tags" className="block text-sm font-medium text-white/70 mb-1">Etiquetas</label>
                      <div className="relative">
                        <select
                          id="tags"
                          name="tags"
                          value={productData.tags}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors appearance-none"
                        >
                          <option value="" className="bg-black text-white">Seleccionar...</option>
                          <option value="Nuevo" className="bg-black text-white">Nuevo</option>
                          <option value="Oferta" className="bg-black text-white">Oferta</option>
                          <option value="Destacado" className="bg-black text-white">Destacado</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                          <ChevronDown size={16} className="text-white/50" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="brand" className="block text-sm font-medium text-white/70 mb-1">Desarrollador</label>
                      <input
                        type="text"
                        id="brand"
                        name="brand"
                        value={productData.brand}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                        placeholder="Desarrollador del producto"
                      />
                    </div>

                    <div>
                      <label htmlFor="vendor" className="block text-sm font-medium text-white/70 mb-1">Distribuidor</label>
                      <input
                        type="text"
                        id="vendor"
                        name="vendor"
                        value={productData.vendor}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                        placeholder="Distribuidor del producto"
                      />
                    </div>
                  </div>
                </div>
              </div>


              <div className="space-y-6">
              {/* Imágenes */}
              <div className="bg-black/40 backdrop-blur-md border-2  border-dashed border-white/20 rounded-[20px] p-6">
                <div className="flex flex-wrap items-center justify-between my-4 ">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                    <ImageIcon className="w-5 h-5" />
                    Imágenes ({imageFiles.length}/10)
                  </h3>
                  <label className="cursor-pointer bg-black/50 backdrop-blur-md border border-[#FF137A]/40 text-white px-4 py-2 rounded-full shadow-[0_0_12px_-2px_#FF137A] hover:scale-105 transform transition-colors duration-200">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Subir Imágenes
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
                        className="w-full h-32 object-cover rounded-[20px] border border-white/20"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-[#FF137A]/50 text-[#FF137A] p-1 rounded-full opacity-0 group-hover:opacity-100 hover:scale-105 transform transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Videos */}
              <div className="bg-black/40 backdrop-blur-md border-2 border-dashed border-white/20 rounded-[20px] p-6">
                <div className="flex flex-wrap items-center justify-between my-4 ">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                    Videos ({videoFiles.length}/2)
                  </h3>
                  <label className="cursor-pointer bg-black/50 backdrop-blur-md border border-[#00FF37]/40 text-white px-4 py-2 rounded-full shadow-[0_0_12px_-2px_#00FF37] hover:scale-105 transform transition-colors duration-200">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Subir Videos
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                      disabled={videoFiles.length >= 2}
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  {videoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <video
                        src={preview}
                        controls
                        className="w-full h-48 rounded-[20px] border border-white/20"
                      />
                      <button
                        onClick={() => removeVideo(index)}
                        className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-[#FF137A]/50 text-[#FF137A] p-1 rounded-full opacity-0 group-hover:opacity-100 hover:scale-105 transform transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <label className="mt-2 flex items-center gap-2 text-sm text-white/70">
                        <input
                          type="checkbox"
                          checked={videoProcessFlags[index] ?? true}
                          onChange={() => toggleVideoProcessing(index)}
                          className="accent-[#00FF37]"
                        />
                        Comprimir y generar miniatura (puede tardar varios minutos en segundo plano)
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-black/50 backdrop-blur-md border border-[#00FF37]/40 text-white py-3 rounded-full shadow-[0_0_12px_-2px_#00FF37] hover:scale-105 transform transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Producto'
                )}
              </button>
            </div>
            </div>
          </div>
        </main>
  );
};
    
export default NewProduct;