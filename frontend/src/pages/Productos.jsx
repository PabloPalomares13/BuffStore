import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, Star, SlidersHorizontal, X, ChevronDown, RefreshCw } from 'lucide-react';
import logosimple from '../assets/BLogo4K-white.png'; // ajusta la ruta si tu logo está en otro lugar
import { getFavorites, toggleFavorite } from '../components/hooks/favorites';
import StarRating from '../components/ui/StartRating';

/* ---------------------------------------------------------------------
   Config de API — mismo patrón que tu productService.js
------------------------------------------------------------------------ */
const link = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
 
/* ---------- Debounce genérico (búsqueda y precios) ---------- */
function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}
 
async function fetchProductsFromApi() {
  // Asume que existe GET /api/products (ruta raíz) en productRoutes.js,
  // junto a /featured, /search y /:id. Si tu ruta raíz se llama distinto
  // (ej. /api/products/all), ajusta el path aquí.
  const res = await fetch(`${link}/api/products`);
  if (!res.ok) throw new Error('Error al obtener productos');
  const data = await res.json();
  // Soporta tanto { products: [...] } como un array plano [...]
  return Array.isArray(data) ? data : data.products || [];
}

 
const PLATFORM_LABELS = { ps5: 'PS5', pc: 'PC', xbox: 'Xbox' };
const TYPE_LABELS = { digital: 'Digital', physical: 'Físico' };
 
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'rating_desc', label: 'Mejor calificados' },
  { value: 'newest', label: 'Más recientes' },
];
 
/* ---------- Utilidades de filtrado ---------- */
 
function getDisplayImage(product) {
  if (product.displayImageUrl) return product.displayImageUrl;
  const poster = product.media?.find((m) => m.isPoster);
  const firstImage = product.media?.find((m) => m.type === 'image');
  return poster?.url || firstImage?.url || product.media?.[0]?.thumbnail || '';
}
 
function useUniqueValues(products, key) {
  return useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      const val = p[key];
      if (Array.isArray(val)) val.forEach((v) => v && set.add(v));
      else if (val) set.add(val);
    });
    return Array.from(set).sort();
  }, [products, key]);
}
 
/* ---------- Pill de categoría (barra superior) ---------- */
 
function CategoryPill({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 font-Urbanist text-sm transition-colors ${
        active
          ? 'border-white/30 bg-white text-black'
          : 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
      }`}
    >
      {label}
      {count != null && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            active ? 'bg-black/10 text-black' : 'bg-white/10 text-white/60'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
 
/* ---------- Bloque de filtro colapsable del sidebar ---------- */
 
function FilterBlock({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/10 py-5 first:pt-0 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between font-Urbanist text-sm font-semibold text-white"
      >
        {title}
        <ChevronDown
          size={16}
          className={`text-white/50 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}
 
function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 font-Urbanist text-sm text-white/70 hover:text-white">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          checked
            ? 'border-[#00FF37] bg-[#00FF37]/20 shadow-[0_0_8px_rgba(0,255,55,0.5)]'
            : 'border-white/30 bg-white/5'
        }`}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-[#00FF37]" />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
      <span className="truncate">{label}</span>
    </label>
  );
}
 
/* ---------- Sidebar de filtros ---------- */
 
function FilterSidebar({
  products,
  filters,
  setFilters,
  onReset,
  className = '',
}) {
  const categories = useUniqueValues(products, 'category');
  const brands = useUniqueValues(products, 'brand');
  const tags = useUniqueValues(products, 'tags');
 
  // Estado local para que el input responda al instante al escribir,
  // pero el filtro real (que recalcula la grilla) espera una pausa.
  const [priceMinInput, setPriceMinInput] = useState(filters.priceMin);
  const [priceMaxInput, setPriceMaxInput] = useState(filters.priceMax);
  const debouncedPriceMin = useDebouncedValue(priceMinInput, 400);
  const debouncedPriceMax = useDebouncedValue(priceMaxInput, 400);
 
  useEffect(() => {
    setFilters((f) => (f.priceMin === debouncedPriceMin ? f : { ...f, priceMin: debouncedPriceMin }));
  }, [debouncedPriceMin, setFilters]);
 
  useEffect(() => {
    setFilters((f) => (f.priceMax === debouncedPriceMax ? f : { ...f, priceMax: debouncedPriceMax }));
  }, [debouncedPriceMax, setFilters]);
 
  // Si los filtros se resetean desde afuera (botón "Limpiar filtros" o
  // "Limpiar todo"), sincroniza los inputs locales.
  useEffect(() => {
    setPriceMinInput(filters.priceMin);
    setPriceMaxInput(filters.priceMax);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.priceMin === '' && filters.priceMax === '']);
 
  const toggleArrayValue = (key, value) => {
    setFilters((f) => {
      const current = f[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...f, [key]: next };
    });
  };
 
  return (
    <aside
      className={`flex w-full flex-col rounded-[20px] border border-white/15 bg-white/[0.04] backdrop-blur-xl p-5 ${className}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-haze text-lg tracking-wide text-white">FILTROS</h3>
        <button
          onClick={onReset}
          className="font-Urbanist text-xs text-white/50 underline decoration-white/20 underline-offset-2 hover:text-white"
        >
          Limpiar filtros
        </button>
      </div>
 
      <FilterBlock title="Tipo de producto">
        <div className="flex flex-wrap gap-2">
          {[{ value: 'all', label: 'Todos' }, ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))].map(
            (opt) => (
              <button
                key={opt.value}
                onClick={() => setFilters((f) => ({ ...f, type: opt.value }))}
                className={`rounded-full border px-3.5 py-1.5 font-Urbanist text-xs transition-colors ${
                  filters.type === opt.value
                    ? 'border-[#00FF37]/50 bg-[#00FF37]/10 text-white shadow-[0_0_10px_rgba(0,255,55,0.3)]'
                    : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            )
          )}
        </div>
      </FilterBlock>
 
      {categories.length > 0 && (
        <FilterBlock title="Categoría">
          <div className="flex flex-col gap-0.5">
            {categories.map((cat) => (
              <CheckboxRow
                key={cat}
                label={cat}
                checked={filters.categories.includes(cat)}
                onChange={() => toggleArrayValue('categories', cat)}
              />
            ))}
          </div>
        </FilterBlock>
      )}
 
      <FilterBlock title="Plataforma">
        <div className="flex flex-col gap-0.5">
          {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
            <CheckboxRow
              key={value}
              label={label}
              checked={filters.platforms.includes(value)}
              onChange={() => toggleArrayValue('platforms', value)}
            />
          ))}
        </div>
      </FilterBlock>
 
      <FilterBlock title="Precio (COP)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Mínimo"
            value={priceMinInput}
            onChange={(e) => setPriceMinInput(e.target.value)}
            className="w-full rounded-full border border-white/20 bg-white/5 px-3.5 py-2 font-Urbanist text-xs text-white placeholder:text-white/40 outline-none focus:border-[#FF137A]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-white/30">–</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Máximo"
            value={priceMaxInput}
            onChange={(e) => setPriceMaxInput(e.target.value)}
            className="w-full rounded-full border border-white/20 bg-white/5 px-3.5 py-2 font-Urbanist text-xs text-white placeholder:text-white/40 outline-none focus:border-[#FF137A]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </FilterBlock>
 
      {brands.length > 0 && (
        <FilterBlock title="Marca" defaultOpen={false}>
          <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto pr-1">
            {brands.map((brand) => (
              <CheckboxRow
                key={brand}
                label={brand}
                checked={filters.brands.includes(brand)}
                onChange={() => toggleArrayValue('brands', brand)}
              />
            ))}
          </div>
        </FilterBlock>
      )}
 
      {tags.length > 0 && (
        <FilterBlock title="Etiquetas" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 16).map((tag) => {
              const active = filters.tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleArrayValue('tags', tag)}
                  className={`max-w-full truncate rounded-full border px-2.5 py-1 font-Urbanist text-[11px] transition-colors ${
                    active
                      ? 'border-[#FF137A]/50 bg-[#FF137A]/10 text-white shadow-[0_0_8px_rgba(255,19,122,0.3)]'
                      : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </FilterBlock>
      )}
 
      <FilterBlock title="Destacados" defaultOpen={false}>
        <CheckboxRow
          label="Solo productos destacados"
          checked={filters.featuredOnly}
          onChange={() => setFilters((f) => ({ ...f, featuredOnly: !f.featuredOnly }))}
        />
      </FilterBlock>
    </aside>
  );
}
 
/* ---------- Card de producto (grilla) ---------- */
 
function ProductCard({ product, onProductClick, onAddToCart, isFavorite, onToggleFavorite }) {
  const tags = product.tags?.length ? product.tags : product.category ? [product.category] : [];
  const image = getDisplayImage(product);
 
  const favCartButtons = (
    <div className="absolute top-6 right-6 lg:top-4 lg:right-4 z-20 flex gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(product);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF137A] shadow-[0_0_10px_rgba(255,19,122,0.6)] transition-transform hover:scale-105"
        aria-label="Añadir a favoritos"
      >
        <Heart size={16} className="text-white" fill={isFavorite ? 'white' : 'none'} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToCart?.(product);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00FF37] shadow-[0_0_10px_rgba(0,255,55,0.6)] transition-transform hover:scale-105"
        aria-label="Añadir al carrito"
      >
        <ShoppingCart size={16} className="text-black" />
      </button>
    </div>
  );
 
  const cardInfo = (
    <>
      <h3 className="text-xl lg:text-lg text-white leading-tight break-words">{product.name}</h3>
 
      <StarRating rating={product.rating} />
 
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="max-w-[45%] truncate rounded-full bg-white/15 backdrop-blur-sm px-2 py-0.5 text-[10px] font-Urbanist text-white/90"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
 
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="font-Urbanist text-base font-bold text-white">
          ${Number(product.price).toLocaleString('en-US')} COP
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(product);
          }}
          className="shrink-0 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-1.5 font-haze text-xs tracking-wide text-white transition-colors hover:bg-white/20"
        >
          COMPRAR
        </button>
      </div>
    </>
  );
 
  return (
    <div
      onClick={() => onProductClick?.(product._id)}
      className="group relative w-full cursor-pointer transition-transform duration-300 ease-out hover:scale-[1.02]"
    >
      {/* ===== Móvil / tablet (< lg): info superpuesta sobre la imagen, como antes ===== */}
      <div className="relative aspect-[4/4] w-full overflow-hidden rounded-[20px] border border-white/30 lg:hidden">
        <img
          src={image}
          alt={product.name}
          className="absolute inset-0 h-full w-full object-cover opacity-50 blur-[1px]"
        />
 
        {favCartButtons}
 
        <div className="absolute inset-3 flex flex-col justify-end overflow-hidden rounded-[20px]">
          <img src={image} alt="fondo" className="absolute inset-0 h-full w-full object-cover" />
          <div className="relative">
            <div
              className="absolute -top-20 inset-x-0 bottom-0 rounded-b-[20px] bg-black/50 backdrop-blur-[60px]"
              style={{
                maskImage:
                  'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0.9) 60%, black 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 15%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0.9) 60%, black 100%)',
              }}
            />
            <div className="relative z-10 flex flex-col gap-1.5 p-3">{cardInfo}</div>
          </div>
        </div>
      </div>
 
      {/* ===== Escritorio (lg+): imagen limpia arriba, info como panel aparte debajo ===== */}
      <div className="hidden lg:block">
        <div className="relative z-10 -mb-4 aspect-video w-full overflow-hidden rounded-[20px] border border-white/30">
          <img src={image} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
          {favCartButtons}
        </div>
        <div className="relative z-0 flex flex-col gap-1.5 rounded-b-[20px] border border-white/20 bg-black/50 backdrop-blur-xl p-4 pt-8">
          {cardInfo}
        </div>
      </div>
    </div>
  );
}
 
function ProductCardSkeleton() {
  return (
    <div className="aspect-[3/4] lg:aspect-video w-full animate-pulse rounded-[20px] border border-white/10 bg-white/5" />
  );
}
 
/* ---------- Página principal ---------- */
 
export default function Productos({
  products: productsProp, // opcional: si lo pasas, se usa tal cual y NO se hace fetch interno
  onProductClick,
  onAddToCart,
}) {
  const navigate = useNavigate();
 
  // Por defecto navega al detalle del producto — igual que las cards
  // dentro de CatalogSection. Se puede sobreescribir pasando la prop.
  const handleProductClick = onProductClick || ((id) => navigate(`/product/${id}`));
 
  // Por defecto agrega al carrito en localStorage — mismo patrón que
  // handleAddToCart en CatalogSection.jsx. Se puede sobreescribir.
  const handleAddToCart =
    onAddToCart ||
    ((product) => {
      const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
      const existingIndex = currentCart.findIndex((item) => item._id === product._id);
      if (existingIndex >= 0) {
        currentCart[existingIndex].quantity += 1;
      } else {
        currentCart.push({ _id: product._id, name: product.name, price: product.price, quantity: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(currentCart));
    });
 
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [loading, setLoading] = useState(productsProp === undefined);
  const [error, setError] = useState(null);
 
  const loadProducts = () => {
    setLoading(true);
    setError(null);
    fetchProductsFromApi()
      .then(setFetchedProducts)
      .catch((err) => {
        console.error('Error al cargar productos:', err);
        setError('No pudimos cargar los productos. Intenta de nuevo.');
      })
      .finally(() => setLoading(false));
  };
 
  useEffect(() => {
    if (productsProp === undefined) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  const products = productsProp !== undefined ? productsProp : fetchedProducts;
 
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [sort, setSort] = useState('relevance');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    categories: [],
    platforms: [],
    brands: [],
    tags: [],
    priceMin: '',
    priceMax: '',
    featuredOnly: false,
  });
 
  useEffect(() => {
    getFavorites().then(setFavorites);
  }, []);
 
  const handleToggleFavorite = async (product) => {
    const updated = await toggleFavorite(product, favorites);
    setFavorites(updated);
  };
 
  const resetFilters = () =>
    setFilters({
      type: 'all',
      categories: [],
      platforms: [],
      brands: [],
      tags: [],
      priceMin: '',
      priceMax: '',
      featuredOnly: false,
    });
 
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.trim().toLowerCase();
        const haystack = `${p.name} ${p.code || ''} ${p.brand || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.type !== 'all' && p.type !== filters.type) return false;
      if (filters.categories.length && !filters.categories.includes(p.category)) return false;
      if (filters.platforms.length && !p.platforms?.some((pl) => filters.platforms.includes(pl))) return false;
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
      if (filters.tags.length && !p.tags?.some((t) => filters.tags.includes(t))) return false;
      if (filters.priceMin && Number(p.price) < Number(filters.priceMin)) return false;
      if (filters.priceMax && Number(p.price) > Number(filters.priceMax)) return false;
      if (filters.featuredOnly && !p.featured) return false;
      return true;
    });
 
    switch (sort) {
      case 'price_asc':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'rating_desc':
        result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        result = [...result].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        break;
      default:
        break;
    }
    return result;
  }, [products, debouncedSearch, filters, sort]);
 
  const topCategories = useUniqueValues(products, 'category');
  const [activeCategory, setActiveCategory] = useState('all');
 
  useEffect(() => {
    setFilters((f) => ({
      ...f,
      categories: activeCategory === 'all' ? [] : [activeCategory],
    }));
  }, [activeCategory]);
 
  const activeFilterCount =
    filters.categories.length +
    filters.platforms.length +
    filters.brands.length +
    filters.tags.length +
    (filters.type !== 'all' ? 1 : 0) +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0) +
    (filters.featuredOnly ? 1 : 0);
 
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-black pt-28"
      style={{ fontFamily: '"Urbanist", sans-serif' }}
    >
      {/* Ambiente: manchas de luz neón en esquinas opuestas */}
      <style>{`
        @keyframes plt-orbit-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .plt-orbit { animation: plt-orbit-spin 22s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .plt-orbit { animation: none; }
        }
      `}</style>
 
      {/* Dos manchas de luz neón, fijas en el centro de la pantalla (no se mueven al hacer scroll) y girando en círculo sin parar */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center">
        <div className="plt-orbit relative h-[560px] w-[560px]">
          <div className="absolute left-0 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
          <div className="absolute right-0 top-1/2 h-[460px] w-[460px] translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />
        </div>
      </div>
      <img
        src={logosimple}
        alt="fondo"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-auto -translate-x-1/2 -translate-y-1/2 opacity-10 blur-sm"
      />
 
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
        {/* Encabezado + categorías */}
        <div className="mb-6">
          <p className=" text-xs text-white/60 pb-6">Inicio / Explorar</p>
          <h1 className="mt-1 font-haze text-4xl text-white sm:text-5xl">Catálogo de Productos</h1>
        </div>
 
        {topCategories.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
            <CategoryPill
              label="Todos"
              count={products.length}
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
            />
            {topCategories.map((cat) => (
              <CategoryPill
                key={cat}
                label={cat}
                count={products.filter((p) => p.category === cat).length}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              />
            ))}
          </div>
        )}
 
        {/* Buscador + orden */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar juegos, monedas, suscripciones..."
              className="w-full rounded-full border border-white/20 bg-white/10 backdrop-blur-sm py-3 pl-11 pr-4 font-Urbanist text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#FF137A]/50"
            />
          </div>
 
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-5 py-3 font-Urbanist text-sm text-white transition-colors hover:bg-white/20 lg:hidden"
          >
            <SlidersHorizontal size={16} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-[#FF137A] px-1.5 py-0.5 text-[10px] shadow-[0_0_8px_rgba(255,19,122,0.6)]">
                {activeFilterCount}
              </span>
            )}
          </button>
 
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full appearance-none rounded-full border border-white/20 bg-white/10 backdrop-blur-sm py-3 pl-4 pr-9 font-Urbanist text-sm text-white outline-none transition-colors focus:border-[#00FF37]/50 sm:w-auto [&>option]:bg-black"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/50"
            />
          </div>
        </div>
 
        {/* Cuerpo: sidebar + grilla */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Sidebar desktop */}
          <FilterSidebar
            products={products}
            filters={filters}
            setFilters={setFilters}
            onReset={resetFilters}
            className="hidden lg:sticky lg:top-6 lg:block lg:w-[280px] lg:shrink-0"
          />
 
          {/* Sidebar mobile (drawer) */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <div className="relative ml-auto flex h-full w-[85%] max-w-sm flex-col overflow-y-auto bg-black p-4">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="mb-3 flex h-9 w-9 items-center justify-center self-end rounded-full border border-white/20 bg-white/10 text-white"
                >
                  <X size={16} />
                </button>
                <FilterSidebar
                  products={products}
                  filters={filters}
                  setFilters={setFilters}
                  onReset={resetFilters}
                />
              </div>
            </div>
          )}
 
          {/* Grilla de productos */}
          <div className="flex-1">
            <p className="mb-4 font-Urbanist text-sm text-white/50">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado
              {filteredProducts.length !== 1 ? 's' : ''}
            </p>
 
            {loading ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center rounded-[20px] border border-white/15 bg-white/[0.03] py-24 text-center">
                <p className="font-haze text-xl text-white">Algo salió mal</p>
                <p className="mt-2 max-w-xs font-Urbanist text-sm text-white/50">{error}</p>
                <button
                  onClick={loadProducts}
                  className="mt-5 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2.5 font-haze text-xs tracking-wide text-white transition-colors hover:bg-white/20"
                >
                  <RefreshCw size={14} />
                  REINTENTAR
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[20px] border border-white/15 bg-white/[0.03] py-24 text-center">
                <p className="font-haze text-xl text-white">Sin resultados</p>
                <p className="mt-2 max-w-xs font-Urbanist text-sm text-white/50">
                  Ajusta tu búsqueda o quita algunos filtros para ver más productos.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    resetFilters();
                    setActiveCategory('all');
                  }}
                  className="mt-5 rounded-full border border-white/20 bg-white/10 px-6 py-2.5 font-haze text-xs tracking-wide text-white transition-colors hover:bg-white/20"
                >
                  LIMPIAR TODO
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                    isFavorite={favorites.some((f) => f._id === product._id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 