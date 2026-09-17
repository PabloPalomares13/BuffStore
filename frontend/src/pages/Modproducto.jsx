import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RawgSearchBar from '../components/ui/RawgSearchBar';
import { 
  X,Upload,  Image as ImageIcon, ChevronDown,Video, Bold, Italic, Underline, Link, ListOrdered, ListTree, AlignLeft,Loader2, Trash2,
  CheckCircle, AlertCircle, ListChecks
} from 'lucide-react';
import Swal from 'sweetalert2';

// Campos que se pueden traer/reemplazar automáticamente desde RAWG.io.
// El admin marca cuáles quiere sobreescribir ANTES de buscar el juego;
// solo esos campos se tocan al recibir la respuesta del autofill.
const RAWG_FIELD_OPTIONS = [
  { key: 'name', label: 'Nombre' },
  { key: 'description', label: 'Descripción' },
  { key: 'brand', label: 'Desarrollador' },
  { key: 'vendor', label: 'Distribuidor' },
  { key: 'releaseDate', label: 'Fecha de lanzamiento' },
  { key: 'rating', label: 'Rating' },
  { key: 'metacritic', label: 'Metacritic' },
  { key: 'esrbRating', label: 'Clasificación ESRB' },
  { key: 'website', label: 'Sitio web' },
  { key: 'genres', label: 'Géneros' },
  { key: 'platformsFull', label: 'Plataformas' },
  { key: 'rawgTags', label: 'Tags de contenido' },
  { key: 'screenshots', label: 'Capturas de pantalla (imágenes)' },
];

const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'

const Modproducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Form state
  const [productData, setProductData] = useState({
      name: '',
      description: '',
      price: '',
      stock: '',
      taxRate: '',
      category: '',
      tags: '', // etiqueta de marketing: Nuevo / Oferta / Destacado
  
      brand: '',   // desarrollador (autocompletado desde RAWG "developer")
      vendor: '',  // distribuidor (autocompletado desde RAWG "publisher")
  
      // --- Campos nuevos que vienen de RAWG (vía Gemini) o se llenan a mano ---
      rawgId: '',        // referencia interna, no se muestra en el form
      releaseDate: '',
      rating: '',
      ratingsCount: '',
      metacritic: '',
      esrbRating: '',
      website: '',
      genres: '',        // texto separado por comas, ej: "Acción, Aventura"
      platformsFull: '', // texto separado por comas, ej: "PC, PlayStation 5"
      rawgTags: '',       // texto separado por comas, ej: "Mundo abierto, Un jugador"
    });
  
  //const [selectedImage, setSelectedImage] = useState(null);
  //const [loading, setLoading] = useState(true);
  
  //const [currentImages, setCurrentImages] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [existingMedia, setExistingMedia] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newVideoFiles, setNewVideoFiles] = useState([]);
  const [newVideoProcessFlags, setNewVideoProcessFlags] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [newVideoPreviews, setNewVideoPreviews] = useState([]);
  const [mediaToDelete, setMediaToDelete] = useState([]);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [error, setError] = useState(null);

  // NUEVO: checklist de campos a reemplazar cuando se trae info de RAWG.io.
  // Todo arranca sin marcar para no pisar datos por accidente.
  const [rawgFieldsToUpdate, setRawgFieldsToUpdate] = useState(() =>
    RAWG_FIELD_OPTIONS.reduce((acc, field) => ({ ...acc, [field.key]: false }), {})
  );

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

      // "tags" en el backend guarda un array combinado (etiqueta de marketing +
      // géneros + tags de RAWG). Aquí solo recuperamos la etiqueta de marketing
      // si coincide con una de las conocidas; géneros y rawgTags no se pueden
      // separar de ese array combinado, así que quedan vacíos hasta que el
      // admin los vuelva a traer de RAWG o los escriba a mano.
      const marketingTags = ['Nuevo', 'Oferta', 'Destacado'];
      const tagsArray = Array.isArray(data.tags) ? data.tags : [];
      const marketingTag = tagsArray.find(t => marketingTags.includes(t)) || '';

      setProductData({
        name: data.name || '',
        code: data.code || '',
        description: data.description || '',
        price: data.price || '',
        stock: data.stock || '',
        taxRate: data.taxRate || '',
        category: data.category || '',
        tags: marketingTag,
        brand: data.brand || '',
        vendor: data.vendor || '',

        rawgId: data.rawgId || '',
        releaseDate: data.releaseDate || '',
        rating: data.rating ?? '',
        ratingsCount: data.ratingsCount ?? '',
        metacritic: data.metacritic ?? '',
        esrbRating: data.esrbRating || '',
        website: data.website || '',
        genres: data.genres || '',
        platformsFull: Array.isArray(data.platformsFull) ? data.platformsFull.join(', ') : (data.platformsFull || ''),
        rawgTags: data.rawgTags ||'',
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
  
    const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAlert({ show: true, type: 'error', message: 'La portada debe ser una imagen' });
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAlert({ show: true, type: 'error', message: 'La portada excede el tamaño máximo de 5MB' });
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
      return;
    }

    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
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

    // NUEVO: un flag por cada video nuevo, default true (procesar)
    setNewVideoProcessFlags(prev => [...prev, ...validFiles.map(() => true)]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewVideoPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // NUEVO: togglear el flag de un video específico por índice
  const toggleVideoProcessing = (index) => {
    setNewVideoProcessFlags(prev =>
      prev.map((flag, i) => (i === index ? !flag : flag))
    );
  };


  const removeNewImage = (index) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewVideo = (index) => {
  setNewVideoFiles(prev => prev.filter((_, i) => i !== index));
  setNewVideoPreviews(prev => prev.filter((_, i) => i !== index));
  setNewVideoProcessFlags(prev => prev.filter((_, i) => i !== index)); // NUEVO
};

  // NUEVO: handlers del checklist de campos RAWG
  const toggleRawgField = (key) => {
    setRawgFieldsToUpdate(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllRawgFields = () => {
    setRawgFieldsToUpdate(RAWG_FIELD_OPTIONS.reduce((acc, f) => ({ ...acc, [f.key]: true }), {}));
  };

  const clearAllRawgFields = () => {
    setRawgFieldsToUpdate(RAWG_FIELD_OPTIONS.reduce((acc, f) => ({ ...acc, [f.key]: false }), {}));
  };

  // Descarga una screenshot de RAWG y la convierte en un File real, igual que
  // en NewProduct, para que se suba por el mismo flujo de multer/GCS.
  const urlToImageFile = async (url, filename) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudo descargar la imagen');
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  };

  // Trae las screenshots de RAWG y las agrega como "nuevas imágenes",
  // respetando el límite de 10 imágenes (contando las que ya existen).
  const addRawgScreenshotsAsImages = async (screenshotUrls = []) => {
    if (!screenshotUrls.length) return;

    const imagenesActuales = existingMedia.filter(m => m.type === 'image').length + newImageFiles.length;
    const espacioDisponible = 10 - imagenesActuales;
    if (espacioDisponible <= 0) {
      setAlert({ show: true, type: 'error', message: 'Ya tienes el máximo de 10 imágenes, quita alguna para traer las screenshots' });
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
      return;
    }

    const urlsAUsar = screenshotUrls.slice(0, espacioDisponible);
    let fallidas = 0;

    for (let i = 0; i < urlsAUsar.length; i++) {
      try {
        const file = await urlToImageFile(urlsAUsar[i], `rawg_screenshot_${Date.now()}_${i}.jpg`);
        setNewImageFiles(prev => [...prev, file]);
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImagePreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('No se pudo traer una screenshot de RAWG:', error);
        fallidas += 1;
      }
    }

    if (fallidas > 0) {
      setAlert({ show: true, type: 'error', message: `${fallidas} screenshot(s) no se pudieron descargar, súbelas manualmente si las quieres` });
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    }
  };

  // Aplica al form solo los campos marcados en el checklist, con la
  // información que trae RawgSearchBar. Nada que no esté marcado se toca.
  const applyRawgAutofill = (data) => {
    const selectedKeys = RAWG_FIELD_OPTIONS
      .map(f => f.key)
      .filter(key => rawgFieldsToUpdate[key]);

    if (selectedKeys.length === 0) {
      setAlert({ show: true, type: 'error', message: 'Marca al menos un campo del checklist antes de traer los datos de RAWG.' });
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
      return;
    }

    const fieldLabels = RAWG_FIELD_OPTIONS
      .filter(f => selectedKeys.includes(f.key))
      .map(f => f.label)
      .join(', ');

    const confirmar = window.confirm(
      `Esto va a reemplazar estos campos con los datos de "${data.name}" desde RAWG.io: ${fieldLabels}. ¿Continuar?`
    );
    if (!confirmar) return;

    setProductData(prev => {
      const updated = { ...prev };
      if (selectedKeys.includes('name')) updated.name = data.name || prev.name;
      if (selectedKeys.includes('description')) updated.description = data.description || prev.description;
      if (selectedKeys.includes('brand')) updated.brand = data.developer || prev.brand;
      if (selectedKeys.includes('vendor')) updated.vendor = data.publisher || prev.vendor;
      if (selectedKeys.includes('releaseDate')) updated.releaseDate = data.releaseDate || prev.releaseDate;
      if (selectedKeys.includes('rating')) {
        updated.rating = data.rating ?? prev.rating;
        updated.ratingsCount = data.ratingsCount ?? prev.ratingsCount;
      }
      if (selectedKeys.includes('metacritic')) updated.metacritic = data.metacritic ?? prev.metacritic;
      if (selectedKeys.includes('esrbRating')) updated.esrbRating = data.esrbRating || prev.esrbRating;
      if (selectedKeys.includes('website')) updated.website = data.website || prev.website;
      if (selectedKeys.includes('genres')) updated.genres = (data.genres || []).join(', ');
      if (selectedKeys.includes('platformsFull')) updated.platformsFull = (data.platforms || []).join(', ');
      if (selectedKeys.includes('rawgTags')) updated.rawgTags = (data.tags || []).join(', ');

      // rawgId es referencia interna (no se muestra), se guarda siempre que
      // se aplique cualquier campo para mantener el vínculo con RAWG.
      updated.rawgId = data.rawgId ?? prev.rawgId;
      return updated;
    });

    if (selectedKeys.includes('screenshots')) {
      addRawgScreenshotsAsImages(data.images?.screenshots || []);
    }

    setAlert({ show: true, type: 'success', message: `✅ Campos actualizados desde RAWG: ${fieldLabels}` });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
  };

  const markExistingForDeletion = (e, mediaItem) => {
    e.preventDefault();
    e.stopPropagation();
    setMediaToDelete(prev => [...prev, mediaItem.fileName]);
    setExistingMedia(prev => prev.filter(m => m.fileName !== mediaItem.fileName));
  };
  const handleSubmit = async () => {
  setIsSubmitting(true);

  // Campos que van directo como texto/número (igual que en NewProduct).
  const directFields = [
    'name', 'code', 'description', 'price', 'stock', 'taxRate',
    'category', 'brand', 'vendor',
    'rawgId', 'releaseDate', 'rating', 'ratingsCount', 'metacritic',
    'esrbRating', 'website',
  ];

  const formData = new FormData();
    directFields.forEach((key) => {
      if (productData[key] !== '' && productData[key] !== undefined && productData[key] !== null) {
        formData.append(key, productData[key]);
      }
    });

    // "tags" combina la etiqueta de marketing + géneros + tags de RAWG,
    // igual que en NewProduct, para que el buscador siga encontrando el
    // producto por género o característica.
    const combinedTags = [
      productData.tags,
      //...productData.genres.split(',').map(t => t.trim()),
      //...productData.rawgTags.split(',').map(t => t.trim()),
    ].filter(Boolean);
    formData.append('tags', JSON.stringify(combinedTags));

    const platformsFullArray = productData.platformsFull
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);
    formData.append('platformsFull', JSON.stringify(platformsFullArray));

    newImageFiles.forEach(file => {
      formData.append('images', file);
    });

    newVideoFiles.forEach(file => {
      formData.append('videos', file);
    });
    if (coverFile) {
      formData.append('poster', coverFile);
    }

    formData.append('videoProcessFlags', JSON.stringify(newVideoProcessFlags));

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

      setIsSubmitting(false);
      setAlert({ show: true, type: 'success', message: '✅ Producto actualizado exitosamente' });

      setTimeout(() => {
        navigate('/listaproductos');
      }, 2000);

    } catch (error) {
      setIsSubmitting(false);
      setAlert({
        show: true,
        type: 'error',
        message: `⚠️ ${error.message}`
      });
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
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
    <main className="flex-1 bg-transparent">
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
      <form onSubmit={handleSubmit}>
        <div
          className="relative bg-transparent backdrop-blur-md rounded-[20px] shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] shadow-[#000000]/70 p-6 overflow-hidden"
          style={{ fontFamily: '"Urbanist", sans-serif' }}
        >
          <div className="mb-6">
            <h1 className="font-haze uppercase text-2xl tracking-widest text-white">
              Modificación del <span className="text-[#00FF37]">Producto</span>
            </h1>
          </div>
          {/* Manchas de luz neón difuminadas */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />

          <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 space-y-6">

              {/* Checklist de campos a traer/reemplazar desde RAWG.io */}
              <div className="bg-black/40 backdrop-blur-md rounded-[20px] border border-white/20 p-6 relative z-30">
                <h2 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                  <ListChecks className="w-5 h-5" />
                  Buscar en RAWG.io
                </h2>
                <p className="text-sm text-white/60 mb-4">
                  Marca qué campos quieres reemplazar antes de buscar el juego. Al elegir un resultado, solo se actualizarán los campos marcados; el resto del producto queda igual.
                </p>

                <div className="mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-white/70">Campos a actualizar</span>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={selectAllRawgFields}
                        className="text-xs text-[#00FF37] hover:underline"
                      >
                        Seleccionar todos
                      </button>
                      <button
                        type="button"
                        onClick={clearAllRawgFields}
                        className="text-xs text-white/50 hover:underline"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {RAWG_FIELD_OPTIONS.map(field => (
                      <label
                        key={field.key}
                        className="flex items-center gap-2 text-sm text-white/70 bg-white/5 rounded-full px-3 py-1.5 cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={rawgFieldsToUpdate[field.key]}
                          onChange={() => toggleRawgField(field.key)}
                          className="accent-[#00FF37]"
                        />
                        {field.label}
                      </label>
                    ))}
                  </div>
                </div>

                <RawgSearchBar
                  token={localStorage.getItem('userToken')}
                  onAutofill={applyRawgAutofill}
                />
              </div>

              <div className="bg-black/40 backdrop-blur-md rounded-[20px] border border-white/20 p-6">
                <h2 className="text-lg font-semibold mb-2 text-white">Información Básica</h2>
                <p className="text-sm text-white/60 mb-6">Sección para modificar información del producto</p>

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
                      required
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
                        <button type="button" className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
                          <Bold size={16} />
                        </button>
                        <button type="button" className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
                          <Italic size={16} />
                        </button>
                        <button type="button" className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
                          <Underline size={16} />
                        </button>
                        <button type="button" className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
                          <Link size={16} />
                        </button>
                        <div className="h-4 w-px bg-white/20 mx-1"></div>
                        <button type="button" className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
                          <ListOrdered size={16} />
                        </button>
                        <button type="button" className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
                          <ListTree size={16} />
                        </button>
                        <button type="button" className="p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-[#00FF37] transition-colors">
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
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="bg-black/40 backdrop-blur-md rounded-[20px] border border-white/20 p-6">
                  <h2 className="text-lg font-semibold mb-2 text-white">Precios y Stock</h2>
                  <p className="text-sm text-white/60 mb-6">Sección para configurar información de ventas del producto</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
                          max="9999999"
                          value={(productData.price).toLocaleString('en-US')}
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

              {/* Organization Card */}
              <div className="bg-black/40 backdrop-blur-md rounded-[20px] border border-white/20 p-6">
                <h2 className="text-lg font-semibold mb-2 text-white">Organización</h2>
                <p className="text-sm text-white/60 mb-6">Sección para modificar los atributos del producto</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <option value="Acción" className="bg-black text-white">Acción</option>
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
                    <label htmlFor="brand" className="block text-sm font-medium text-white/70 mb-1">Marca</label>
                    <input
                      type="text"
                      id="brand"
                      name="brand"
                      value={productData.brand}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                      placeholder="Marca"
                    />
                  </div>

                  <div>
                    <label htmlFor="vendor" className="block text-sm font-medium text-white/70 mb-1">Proveedor</label>
                    <input
                      type="text"
                      id="vendor"
                      name="vendor"
                      value={productData.vendor}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                      placeholder="Proveedor"
                    />
                  </div>
                </div>
              </div>

              {/* Metadata de RAWG — se autocompleta con el checklist + buscador de
                  arriba, según los campos marcados. También se puede editar a mano. */}
              <div className="bg-black/40 backdrop-blur-md rounded-[20px] border border-white/20 p-6">
                <h2 className="text-lg font-semibold mb-2 text-white">Metadata (RAWG.io)</h2>
                <p className="text-sm text-white/60 mb-6">
                  Se llena con el checklist de arriba al elegir un juego. También puedes escribirla a mano.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3">
                  <div>
                    <label htmlFor="releaseDate" className="block text-sm font-medium text-white/70 mb-1">Fecha de lanzamiento</label>
                    <input
                      type="text"
                      id="releaseDate"
                      name="releaseDate"
                      value={productData.releaseDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                      placeholder="YYYY-MM-DD"
                    />
                  </div>

                  <div>
                    <label htmlFor="rating" className="block text-sm font-medium text-white/70 mb-1">Rating (0-5)</label>
                    <input
                      type="text"
                      id="rating"
                      name="rating"
                      value={productData.rating}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                      placeholder="4.5"
                    />
                  </div>

                  <div>
                    <label htmlFor="metacritic" className="block text-sm font-medium text-white/70 mb-1">Metacritic</label>
                    <input
                      type="text"
                      id="metacritic"
                      name="metacritic"
                      value={productData.metacritic}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                      placeholder="92"
                    />
                  </div>

                  <div>
                    <label htmlFor="esrbRating" className="block text-sm font-medium text-white/70 mb-1">Clasificación ESRB</label>
                    <input
                      type="text"
                      id="esrbRating"
                      name="esrbRating"
                      value={productData.esrbRating}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                      placeholder="Mature"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="website" className="block text-sm font-medium text-white/70 mb-1">Sitio web oficial</label>
                    <input
                      type="text"
                      id="website"
                      name="website"
                      value={productData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="genres" className="block text-sm font-medium text-white/70 mb-1">Géneros (separados por coma)</label>
                    <input
                      type="text"
                      id="genres"
                      name="genres"
                      value={productData.genres}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                      placeholder="Acción, Aventura"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="platformsFull" className="block text-sm font-medium text-white/70 mb-1">Plataformas (separadas por coma)</label>
                    <input
                      type="text"
                      id="platformsFull"
                      name="platformsFull"
                      value={productData.platformsFull}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                      placeholder="PC, PlayStation 5, Xbox Series X|S"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="rawgTags" className="block text-sm font-medium text-white/70 mb-1">Tags de contenido (separados por coma)</label>
                    <input
                      type="text"
                      id="rawgTags"
                      name="rawgTags"
                      value={productData.rawgTags}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
                      placeholder="Mundo abierto, Un jugador"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
            {/* Medios Existentes */}
            {existingMedia.length > 0 && (
              <div className="bg-black/40 backdrop-blur-md border-2 border-white/20 rounded-[20px] p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Archivos Actuales</h3>
                <div className="grid grid-cols-3 gap-4">
                  {existingMedia.map((media, index) => (
                    <div key={index} className="relative group">
                      <div onClick={() => setPreviewMedia({ type: media.type, url: media.url, thumbnail: media.thumbnail })} className="cursor-pointer">
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt={`Existing ${index}`}
                            className="w-full h-32 object-cover rounded-[20px] border border-white/20"
                          />
                        ) : (
                          <div className="relative">
                            {media.thumbnail ? (
                              <img src={media.thumbnail} alt="Video" className="w-full h-32 object-cover rounded-[20px] border border-white/20" />
                            ) : media.url ? (
                              <video src={media.url} className="w-full h-32 object-cover rounded-[20px] border border-white/20" />
                            ) : (
                              <div className="w-full h-32 bg-white/10 rounded-[20px] border border-white/20 flex items-center justify-center">
                                <Video className="w-8 h-8 text-white/40" />
                              </div>
                            )}

                          </div>
                        )}
                        <button
                        type="button"
                          onClick={(e) => markExistingForDeletion(e,media)}
                          className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-[#FF137A]/50 text-[#FF137A] p-1 rounded-full opacity-0 group-hover:opacity-100 hover:scale-105 transform transition-colors duration-200"
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
            <div className="bg-black/40 backdrop-blur-md border-2  border-dashed border-white/20 rounded-[20px] p-6">
              <div className="flex flex-wrap items-center justify-between my-4 ">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <ImageIcon className="w-5 h-5" />
                  Nuevas Imágenes ({newImageFiles.length})
                </h3>
                <label className="cursor-pointer bg-black/50 backdrop-blur-md border border-[#FF137A]/40 text-white px-4 py-2 rounded-full shadow-[0_0_12px_-2px_#FF137A] hover:scale-105 transform transition-colors duration-200">
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
                      onClick={() => setPreviewMedia({ type: 'image', url: preview })}
                      className="w-full h-32 object-cover rounded-[20px] border border-white/20 cursor-pointer"
                    />
                    <button
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-[#FF137A]/50 text-[#FF137A] p-1 rounded-full opacity-0 group-hover:opacity-100 hover:scale-105 transform transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

              <div className="bg-black/40 backdrop-blur-md border-2 border-dashed border-white/20 rounded-[20px] p-6">
                <div className="flex flex-wrap items-center justify-between my-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                    <ImageIcon className="w-5 h-5" />
                    Foto de Portada
                  </h3>
                  {!coverPreview && (
                    <label className="cursor-pointer bg-black/50 backdrop-blur-md border border-[#FF137A]/40 text-white px-4 py-2 rounded-full shadow-[0_0_12px_-2px_#FF137A] hover:scale-105 transform transition-colors duration-200">
                      <Upload className="w-4 h-4 inline mr-2" />
                      Subir Portada
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-white/40 mb-2">Se usará para mostrar el producto en el Home. Solo una imagen.</p>

                {coverPreview && (
                  <div className="relative group w-full max-w-xs">
                    <img
                      src={coverPreview}
                      alt="Portada"
                      className="w-full h-40 object-cover rounded-[20px] border border-white/20"
                    />
                    <button
                      onClick={removeCover}
                      className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-[#FF137A]/50 text-[#FF137A] p-1 rounded-full opacity-0 group-hover:opacity-100 hover:scale-105 transform transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>            

            {/* Nuevos Videos */}
            <div className="bg-black/40 backdrop-blur-md border-2 border-dashed border-white/20 rounded-[20px] p-6">
              <div className="flex flex-wrap items-center justify-between my-4 ">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <Video className="w-5 h-5" />
                  Nuevos Videos ({newVideoFiles.length})
                </h3>
                <label className="cursor-pointer bg-black/50 backdrop-blur-md border border-[#00FF37]/40 text-white px-4 py-2 rounded-full shadow-[0_0_12px_-2px_#00FF37] hover:scale-105 transform transition-colors duration-200">
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
                      onClick={() => setPreviewMedia({ type: 'video', url: preview })}
                      className="w-full h-48 rounded-[20px] border border-white/20 cursor-pointer"
                    />
                    <button
                      onClick={() => removeNewVideo(index)}
                      className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-[#FF137A]/50 text-[#FF137A] p-1 rounded-full opacity-0 group-hover:opacity-100 hover:scale-105 transform transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* checkbox de procesamiento opcional */}
                    <label className="mt-2 flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={newVideoProcessFlags[index] ?? true}
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
                  Guardando cambios...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
            <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full bg-transparent hover:bg-white/10 text-white/70 py-2 px-4 rounded-full border border-white/20 transition-colors duration-300"
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
                className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/20 text-white p-2 rounded-full hover:bg-white/10 hover:scale-105 transform transition-colors duration-200 z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div onClick={(e) => e.stopPropagation()} className="max-w-6xl max-h-[90vh] w-full">
                {previewMedia.type === 'image' ? (
                  <img
                    src={previewMedia.url}
                    alt="Preview"
                    className="w-full h-full object-contain rounded-[20px]"
                  />
                ) : (
                  <video
                    src={previewMedia.url}
                    controls
                    autoPlay
                    className="w-full h-full max-h-[90vh] rounded-[20px]"
                  />
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </form>
    </main>
  );
};
    
export default Modproducto;