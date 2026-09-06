import { useState, useEffect, useMemo, useCallback, useRef  } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ps5 from '../../assets/ps5.png';
import xbox from "../../assets/xbox.png";
import win from "../../assets/win.png";

const ROTATE_INTERVAL_MS = 30000;
const TRANSITION_CLASS =
  "transition-[flex-grow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]";
 
// ---------------------------------------------------------------------------
// Brillo de borde: se mantiene igual a tu implementación original.
// ---------------------------------------------------------------------------
function useEdgeBrightness(src, region = "bottom") {
  const [alpha, setAlpha] = useState(0.45);
 
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
 
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
 
        const sy = region === "bottom" ? img.height * 0.62 : 0;
        const sh = region === "bottom" ? img.height * 0.38 : img.height;
        ctx.drawImage(img, 0, sy, img.width, sh, 0, 0, size, size);
 
        const { data } = ctx.getImageData(0, 0, size, size);
        let total = 0,
          count = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 10) continue;
          total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          count++;
        }
        const brightness = count ? total / count : 90;
        const mapped = 0.28 + (brightness / 255) * 0.4;
        if (!cancelled) setAlpha(Math.min(0.65, Math.max(0.28, mapped)));
      } catch {
        if (!cancelled) setAlpha(0.45);
      }
    };
    img.onerror = () => !cancelled && setAlpha(0.45);
 
    return () => {
      cancelled = true;
    };
  }, [src, region]);
 
  return alpha;
}
 
// ---------------------------------------------------------------------------
// Panel de vidrio reutilizable (tarjetas flotantes sobre imagen)
// ---------------------------------------------------------------------------
function GlassPanel({ imageSrc, className = "", style = {}, children }) {
  const alpha = useEdgeBrightness(imageSrc, "bottom");
  return (
    <div
      className={`text-white ${className}`}
      style={{
        backgroundColor: `rgba(10, 10, 14, ${alpha})`,
        backdropFilter: "blur(2px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function GlassPanelBig({ imageSrc, className = "", style = {}, children }) {
  const alpha = useEdgeBrightness(imageSrc, "bottom");
  return (
    <div
      className={`text-white ${className}`}
      style={{
        backgroundColor: `rgba(20, 20, 14, ${alpha})`,
        backdropFilter: "blur(4px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        
        ...style,
      }}
    >
      {children}
    </div>
  );
}
// ---------------------------------------------------------------------------
// Badges de plataforma
// ---------------------------------------------------------------------------
const PLATFORM_STYLES = {
  ps5: { bg: typeof ps5 !== "undefined" ? ps5 : null, label: "PS5" },
  xbox: { bg: typeof xbox !== "undefined" ? xbox : null, label: "XB" },
  pc: { bg: typeof win !== "undefined" ? win : null, label: "PC" },
};
 
function PlatformBadge({ platform, iconUrl }) {
  const style = PLATFORM_STYLES[platform] ?? {
    bg: null,
    label: platform?.slice(0, 2).toUpperCase(),
  };
  const imageSrc = iconUrl || style.bg;
 
  return (
    <div
      style={{ fontFamily: '"Urbanist", sans-serif' }}
      className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-black/50 p-2 text-[15px] font-bold text-white backdrop-blur"
    >
      {imageSrc ? (
        <img src={imageSrc} alt={platform} className="h-full w-full object-contain" />
      ) : (
        style.label
      )}
    </div>
  );
}
 
function PlatformBadges({ platforms = [], icons = {} }) {
  return (
    <div className="flex gap-2">
      {platforms.map((p) => (
        <PlatformBadge key={p} platform={p} iconUrl={icons[p]} />
      ))}
    </div>
  );
}
 
function formatCOP(value) {
  if (typeof value !== "number") return "";
  return `${value.toLocaleString("es-CO")} COP`;
}
 
function getImage(product) {
  return product?.images?.[0] ?? product?.media?.[0]?.url;
}
function getVideo(product) {
  // Solo videos que ya terminaron de procesarse en Cloud Run
  return product?.media?.find((m) => m.type === "video" );
}
// ---------------------------------------------------------------------------
// Producto grande (columna izquierda, ~65% del ancho, 100% del alto)
// ---------------------------------------------------------------------------
function BigCard({ product, icons, cycleKey, rotateIntervalMs }) {
  const image = getImage(product);
  const videoItem = getVideo(product);
  const navigate = useNavigate();
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const videoRef = useRef(null);

  // Reinicia el estado cada vez que cambia el producto (rotación del carrusel)
  useEffect(() => {
    setVideoReady(false);
    setVideoError(null);
  }, [product._id]);

  // DIAGNÓSTICO TEMPORAL — borra este bloque cuando confirmes qué está pasando
  useEffect(() => {
    console.log("[BigCard] producto:", product.name);
    console.log("[BigCard] media completo:", product.media);
    console.log("[BigCard] videoItem encontrado:", videoItem);
  }, [product, videoItem]);

  // Fix del bug de React con "muted" en <video>: forzarlo vía la propiedad
  // del DOM, no solo el atributo JSX, para que el autoplay no sea bloqueado
  // silenciosamente por el navegador.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
    }
  }, [videoItem]);

  const handleCardClick = () => {
    navigate(`/product/${product._id}`);
  };

  const handleBuyClick = (e) => {
    e.stopPropagation(); // evita que dispare también la navegación de la card
    // lógica de compra / carrito aquí
  };

   return (
    <div
      onClick={handleCardClick}
      className="relative h-full w-full overflow-hidden rounded-2xl cursor-pointer"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={product._id + "-bg"}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Imagen de fondo: se desvanece hacia oscuro cuando el video ya cargó */}
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: videoReady ? 0 : 1 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </motion.div>

          {/* Video: aparece con fade cuando terminó de cargar */}
          {videoItem && (
            <motion.video
              ref={videoRef}
              key={videoItem.url}
              className="absolute inset-0 h-full w-full object-cover"
              src={videoItem.url}
              poster={videoItem.thumbnail || image}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: videoReady ? 1 : 0 }}
              transition={{ duration: 0.6 }}
              onLoadedData={() => setVideoReady(true)}
              onCanPlayThrough={() => setVideoReady(true)}
              onError={(e) => {
                console.error(
                  "[BigCard] ERROR cargando video:",
                  videoItem.url,
                  e.target.error
                );
                setVideoError(e.target.error);
              }}
            />
          )}
          {videoError && (
            <div className="absolute bottom-2 left-2 z-20 rounded bg-red-600/80 px-2 py-1 text-[10px] text-white">
              Error de video (revisa consola): {videoError.message || videoError.code}
            </div>
          )}

          {/* Overlay oscuro (constante, para contraste con el texto) */}
          <motion.div
            className="absolute inset-0 bg-black"
            animate={{ opacity: videoReady ? 0.15 : 0.55 }}
            transition={{ duration: 0.6 }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute left-4 top-4 z-10">
        <PlatformBadges platforms={product.platforms} icons={icons} />
      </div>

      <div className="absolute right-4 top-6 z-10 flex w-48 flex-col items-end gap-2">
        <div className="flex flex-wrap justify-end gap-1 max-w-[12rem]">
          {product.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="max-w-[8rem] truncate rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur"
              title={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="h-1 w-20 overflow-hidden rounded-full bg-white/20">
          <motion.div
            key={cycleKey}
            className="h-full w-full origin-left rounded-full bg-white/70"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: rotateIntervalMs / 1000, ease: "linear" }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={product._id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="absolute bottom-0 left-0 w-full"
        >
          <GlassPanelBig
            imageSrc={image}
            className="flex items-center justify-between gap-4 p-4 md:p-8"
            style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
          >
            <div className="min-w-0">
              <h3
                className="truncate text-lg font-bold md:text-xl"
                style={{ fontFamily: '"Urbanist", sans-serif' }}
              >
                {product.name}
              </h3>
              <p className="line-clamp-2 max-w-md text-xs text-white/70 md:text-sm">
                {product.description}
              </p>
            </div>
            <button
              onClick={handleBuyClick}
              className="shrink-0 rounded-full bg-white px-5 py-4 text-md font-haze tracking-widest text-black transition hover:scale-105 md:text-lg"
            >
              Comprar ahora
            </button>
          </GlassPanelBig>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
 

function ActivatableCard({ product, isActive, weight, onSelect }) {
  const image = getImage(product);

  return (
    <div
      onClick={!isActive ? onSelect : undefined}
      className={`relative w-full overflow-hidden rounded-2xl ${
        !isActive ? "cursor-pointer" : ""
      } ${TRANSITION_CLASS}`}
      style={{ flexGrow: weight, flexBasis: 0, minHeight: 0 }}
    >
      <AnimatePresence mode="wait">
        {isActive ? (
          // ---------- MEDIUM: imagen de fondo completa + glass flotante ----------
          <motion.div
            key={`${product._id}-medium`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="absolute bottom-0 left-0 w-full p-3"
            >
              <GlassPanel
                imageSrc={image}
                className="flex items-center justify-between gap-4 rounded-2xl p-4"
              >
                <div className="min-w-0">
                  <h4 className="break-words text-sm font-semibold">{product.name}</h4>
                  <p className="truncate text-[11px] text-white/60">
                    {product.tags?.join(", ")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-black/30 px-3 py-1 text-xs font-bold px-6 border border-white/30">
                  <h5 className="text-sm text-white text-center font-normal">Comprar</h5>
                  {formatCOP(product.price)}
                </span>
              </GlassPanel>
            </motion.div>
          </motion.div>
        ) : (
          // ---------- SMALL: glass cubre toda la card, imagen 1/2 opaca (sin blur) ----------
          <motion.div
            key={`${product._id}-small`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <GlassPanel
              imageSrc={image}
              className="flex h-full w-full items-center justify-between gap-3 rounded-2xl"
            >
              <div
                className="h-full w-1/2 shrink-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${image})` }}
              />
              <motion.h4
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="w-1/2 break-words text-lg font-semibold text-center"
              >
                {product.name}
              </motion.h4>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
 
// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function FeaturedProducts({ products, platformIcons = {} }) {
  const [order, setOrder] = useState(() => products.slice(0, 5).map((p) => p._id));
  const [activeId, setActiveId] = useState(null); // reemplaza a hoverId
  const [cycleKey, setCycleKey] = useState(0);     // reinicia la barra de progreso
  const timerRef = useRef(null);

  const productsById = useMemo(
    () => Object.fromEntries(products.map((p) => [p._id, p])),
    [products]
  );

  useEffect(() => {
    setOrder((prev) => {
      const validIds = new Set(products.map((p) => p._id));
      const stillValid = prev.filter((id) => validIds.has(id));
      const missing = products
        .slice(0, 5)
        .map((p) => p._id)
        .filter((id) => !stillValid.includes(id));
      return [...stillValid, ...missing].slice(0, 5);
    });
  }, [products]);

  // Si activeId deja de existir en 'order' (o al iniciar), vuelve a la posición 1
  useEffect(() => {
    if (!order.includes(activeId)) {
      setActiveId(order[1]);
    }
  }, [order, activeId]);

  const rotate = useCallback(() => {
    setOrder((prev) => {
      if (prev.length < 2) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  }, []);

  const scheduleRotation = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCycleKey((k) => k + 1);
    timerRef.current = setTimeout(() => {
      rotate();
      scheduleRotation();
    }, ROTATE_INTERVAL_MS);
  }, [rotate]);

  useEffect(() => {
    scheduleRotation();
    return () => clearTimeout(timerRef.current);
  }, [scheduleRotation]);

  // Solo cambia cuál posición está "activa": ya NO reordena el arreglo
  const handleSelect = (id) => {
    setActiveId(id);
  };

  const weights = useMemo(() => {
    const base = {};
    [order[1], order[2], order[3], order[4]].forEach((id) => {
      base[id] = id === activeId ? 2 : 1;
    });
    return base;
  }, [order, activeId]);

  if (order.length === 0) return null;

  const bigProduct = productsById[order[0]];
  const rightColumnIds = [order[1], order[2], order[3], order[4]];
 
  return (
    <section
      className="relative flex flex-col w-full h-full bg-[#000000] p-4 md:py-6"
      style={{ fontFamily: '"Urbanist", sans-serif' }}
    >
      <h2 className="text-5xl font-haze font-bold text-white bg-clip-text text-transparent mb-3 tracking-widest text-center my-8">
              Productos Destacados
            </h2>
            <p className="text-gray-400 text-lg text-center mb-2">Explora nuestra colección exclusiva</p>
      {/* Glow ambiental */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full blur-[110px]"
        style={{ backgroundColor: "rgba(44, 255, 5, 0.25)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-[110px]"
        style={{ backgroundColor: "rgba(255, 19, 122, 0.25)" }}
      />
 
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 md:flex-row mt-4">
        {/* Columna izquierda: producto grande */}
        <div className="h-full min-h-0 w-full md:w-[70%]">
          {bigProduct && (
            <BigCard
              product={bigProduct}
              icons={platformIcons}
              cycleKey={cycleKey}
              rotateIntervalMs={ROTATE_INTERVAL_MS}
            />
          )}
        </div>
 
        {/* Columna derecha: mediano + 3 pequeños */}
         <div className="flex h-full min-h-0 w-full flex-col gap-3 md:w-[30%]">
          {rightColumnIds.map((id) => {
            const product = productsById[id];
            if (!product) return null;
            return (
              <ActivatableCard
                key={id}
                product={product}
                isActive={id === activeId}
                weight={weights[id]}
                onSelect={() => handleSelect(id)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}