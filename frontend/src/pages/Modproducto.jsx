import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  X,Upload,  Image as ImageIcon, ChevronDown,Video, Bold, Italic, Underline, Link, ListOrdered, ListTree, AlignLeft,Loader2, Trash2
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
  //const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImages, setCurrentImages] = useState([]);
  
  const [existingMedia, setExistingMedia] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newVideoFiles, setNewVideoFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [newVideoPreviews, setNewVideoPreviews] = useState([]);
  const [mediaToDelete, setMediaToDelete] = useState([]);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewMedia, setPreviewMedia] = useState(null);
  
  useEffect(() => {
    if (id) {
      fetchProductData();
    } else {
      setLoading(false);
    }
  }, [id]);
  
  const fetchProductData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${link}/api/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar el producto');

      const data = await response.json();
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
        vendor: data.vendor || '',
      });
      setExistingMedia(data.media || []);
    } catch (error) {
      setAlert({ show: true, type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "price") {
      const rawValue = value.replace(/\D/g, "");
      setProductData({ ...productData, [name]: rawValue });
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
      setProductData({ ...productData, [name]: onlyNumbers });
      return;
    }

    setProductData({ ...productData, [name]: value });
  };
  
  const handleNewImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingMedia.filter(m => m.type === 'image').length + newImageFiles.length + files.length;

    if (totalImages > 10) {
      setAlert({ show: true, type: "error", message: "Máximo 10 imágenes permitidas" });
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > 5 * 1024 * 1024) return false;
      return true;
    });

    setNewImageFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };
  
  const handleNewVideoChange = (e) => {
    const files = Array.from(e.target.files);
    const totalVideos = existingMedia.filter(m => m.type === 'video').length + newVideoFiles.length + files.length;

    if (totalVideos > 2) {
      setAlert({ show: true, type: "error", message: "Máximo 2 videos permitidos" });
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('video/')) return false;
      if (file.size > 100 * 1024 * 1024) return false;
      return true;
    });

    setNewVideoFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewVideoPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };


  const removeNewImage = (index) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewVideo = (index) => {
    setNewVideoFiles(prev => prev.filter((_, i) => i !== index));
    setNewVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const markExistingForDeletion = (e, mediaItem) => {
    e.preventDefault();
    e.stopPropagation();
    setMediaToDelete(prev => [...prev, mediaItem.fileName]);
    setExistingMedia(prev => prev.filter(m => m.fileName !== mediaItem.fileName));
  };
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const formData = new FormData();
    for (const key in productData) {
      formData.append(key, productData[key]);
    }
    
    newImageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    newVideoFiles.forEach(file => {
      formData.append('videos', file);
    });

    if (mediaToDelete.length > 0) {
      formData.append('deleteMedia', JSON.stringify(mediaToDelete));
    }

    const token = localStorage.getItem('userToken');

    try {
      const res = await fetch(`${link}/api/products/${id}`, {
        method: 'PUT',
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
          throw new Error('Acceso denegado: solo administradores pueden editar productos.');
        }
        throw new Error('Error al actualizar el producto.');
      }

      setAlert({ show: true, type: 'success', message: '✅ Producto actualizado exitosamente' });
      
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

          {/* Right Column - Product Image 
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
          */}
          <div className="space-y-6">
          {/* Medios Existentes */}
          {existingMedia.length > 0 && (
            <div className="border-2 border-gray-300 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Archivos Actuales</h3>
              <div className="grid grid-cols-3 gap-4">
                {existingMedia.map((media, index) => (
                  <div key={index} className="relative group">
                    <div onClick={() => setPreviewMedia({ type: media.type, url: media.url, thumbnail: media.thumbnail })} className="cursor-pointer">
                      {media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt={`Existing ${index}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="relative">
                          {media.thumbnail ? (
                            <img src={media.thumbnail} alt="Video" className="w-full h-32 object-cover rounded-lg" />
                          ) : media.url ? (
                            <video src={media.url} className="w-full h-32 object-cover rounded-lg" />
                          ) : (
                            <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Video className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          {media.processing && !media.thumbnail && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                      )}
                      <button
                      type="button"
                        onClick={(e) => markExistingForDeletion(e,media)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div> 
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nuevas Imágenes */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Nuevas Imágenes ({newImageFiles.length})
              </h3>
              <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                <Upload className="w-4 h-4 inline mr-2" />
                Agregar Imágenes
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleNewImageChange}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {newImagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`New ${index}`}
                    onClick={() => setPreviewMedia({ type: 'image', url: preview })} // ← NUEVO
                    className="w-full h-32 object-cover rounded-lg cursor-pointer" // ← AGREGADO cursor-pointer
                  />
                  <button
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Nuevos Videos */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Video className="w-5 h-5" />
                Nuevos Videos ({newVideoFiles.length})
              </h3>
              <label className="cursor-pointer bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition">
                <Upload className="w-4 h-4 inline mr-2" />
                Agregar Videos
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleNewVideoChange}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="space-y-4">
              {newVideoPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <video
                    src={preview}
                    onClick={() => setPreviewMedia({ type: 'video', url: preview })} // ← NUEVO
                    className="w-full h-48 rounded-lg cursor-pointer" // ← AGREGADO cursor-pointer, QUITADO controls
                  />
                  <button
                    onClick={() => removeNewVideo(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando cambios...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
          <button 
                  type="button"
                  onClick={handleCancel}
                  className="w-full bg-transparent hover:bg-gray-100 text-gray-700 py-2 px-4 rounded-lg border border-gray-300 transition-all duration-300"
                >
                  Cancelar
          </button>
        </div>
        {previewMedia && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewMedia(null)}
          >
            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute top-4 right-4 bg-white text-black p-2 rounded-full hover:bg-gray-200 transition z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div onClick={(e) => e.stopPropagation()} className="max-w-6xl max-h-[90vh] w-full">
              {previewMedia.type === 'image' ? (
                <img 
                  src={previewMedia.url} 
                  alt="Preview" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <video 
                  src={previewMedia.url} 
                  controls 
                  autoPlay
                  className="w-full h-full max-h-[90vh] rounded-lg"
                />
              )}
            </div>
          </div>
        )}
        </div>
      </form>
    </main>
  );
};
    
export default Modproducto;