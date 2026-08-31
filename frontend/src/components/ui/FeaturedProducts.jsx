
import { useState, useEffect, useMemo, useCallback, useRef  } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
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
 
// ---------------------------------------------------------------------------
// Producto grande (columna izquierda, ~65% del ancho, 100% del alto)
// ---------------------------------------------------------------------------
function BigCard({ product, icons }) {
  const image = getImage(product);
 
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
 
      <div className="absolute left-4 top-4 z-10">
        <PlatformBadges platforms={product.platforms} icons={icons} />
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
            <button className="shrink-0 rounded-full bg-white  px-5 py-4 text-md font-haze tracking-widest text-black transition hover:scale-105 md:text-lg">
              Comprar ahora
            </button>
          </GlassPanelBig>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
 
// ---------------------------------------------------------------------------
// Producto mediano (tope de la columna derecha, 40% de la altura por defecto)
// ---------------------------------------------------------------------------
function MediumCard({ product, weight }) {
  const image = getImage(product);
 
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl ${TRANSITION_CLASS}`}
      style={{ flexGrow: weight, flexBasis: 0, minHeight: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
 
      <AnimatePresence mode="wait">
        <motion.div
          key={product._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute bottom-0 left-0 w-full p-3 px-20"
        >
          <GlassPanel imageSrc={image} className="flex items-center justify-between gap-4 rounded-3xl p-4">
            <div className="min-w-0">
              <h4 className="break-words text-sm font-semibold">{product.name}</h4>
              <p className="truncate text-[11px] text-white/60">
                {product.tags?.join(", ")}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-black/30 px-3 py-1 text-xs font-bold ont-medium px-6 border border-white/30">
              <h5 className="text-sm text-white text-center font-normal">Comprar</h5>
              {formatCOP(product.price)}
            </span>
          </GlassPanel>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
 
// ---------------------------------------------------------------------------
// Producto pequeño (glassmorphism completo, imagen 40% a la derecha)
// ---------------------------------------------------------------------------
function SmallCard({ product, weight, onHover, onLeave, onSelect }) {
  const image = getImage(product);
 
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onSelect}
      className={`w-full cursor-pointer overflow-hidden bg-white/20 rounded-2xl ${TRANSITION_CLASS}`}
      style={{ flexGrow: weight, flexBasis: 0, minHeight: 0 }}
    >
      <GlassPanel
        imageSrc={image}
        className="flex h-full w-full items-center justify-between gap-3 rounded-2xl "
      >
        <div
          className="h-full w-5/10 shrink-0  bg-cover bg-no-repeat bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
        <h4 className="w-3/5 break-words text-lg font-semibold text-center text">{product.name}</h4>
        
      </GlassPanel>
    </div>
  );
}
 
// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function FeaturedProducts({ products, platformIcons = {} }) {
  // order[0] = grande, order[1] = mediano activo, order[2..4] = pequeños (arriba->abajo)
  const [order, setOrder] = useState(() => products.slice(0, 5).map((p) => p._id));
  const [hoverId, setHoverId] = useState(null);
  const timerRef = useRef(null);
 
  const productsById = useMemo(
    () => Object.fromEntries(products.map((p) => [p._id, p])),
    [products]
  );
 
  // Mantiene 'order' sincronizado si cambia el listado de productos desde la BD
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
 
  // --- Rotación cíclica cada 30s -----------------------------------------
  const rotate = useCallback(() => {
    setOrder((prev) => {
      if (prev.length < 2) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  }, []);
 
  const scheduleRotation = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      rotate();
      scheduleRotation();
    }, ROTATE_INTERVAL_MS);
  }, [rotate]);
 
  useEffect(() => {
    scheduleRotation();
    return () => clearTimeout(timerRef.current);
  }, [scheduleRotation]);
 
  // --- Interacciones: hover (preview temporal) y click (persistente) -----
  const handleHover = (id) => {
    setHoverId(id);
    scheduleRotation(); // reinicia el contador de 30s
  };
 
  const handleLeave = () => setHoverId(null);
 
  const handleSelect = (id) => {
    const idx = order.indexOf(id);
    if (idx < 2) return; // solo los pequeños son clicables
    setOrder((prev) => {
      const next = [...prev];
      [next[1], next[idx]] = [next[idx], next[1]]; // el pequeño clicado pasa a ser el mediano activo
      return next;
    });
    setHoverId(null);
    scheduleRotation(); // reinicia el contador de 30s
  };
 
  // --- Pesos de altura para la columna derecha (40/20/20/20) -------------
  const weights = useMemo(() => {
    const base = {
      [order[1]]: 2,
      [order[2]]: 1,
      [order[3]]: 1,
      [order[4]]: 1,
    };
    const hoveredIsSmall = hoverId && [order[2], order[3], order[4]].includes(hoverId);
    if (hoveredIsSmall) {
      return { ...base, [order[1]]: 1, [hoverId]: 2 };
    }
    return base;
  }, [order, hoverId]);
 
  if (order.length === 0) return null;
 
  const bigProduct = productsById[order[0]];
  const mediumProduct = productsById[order[1]];
  const smallIds = [order[2], order[3], order[4]];
 
  return (
    <section
      className="relative flex flex-col w-full h-full overflow-hidden bg-[#050505] p-4 md:py-6"
      style={{ fontFamily: '"Urbanist", sans-serif' }}
    >
      <h2 className="shrink-0 text-5xl font-haze font-semibold text-white bg-clip-text text-transparent mb-3 tracking-widest py-6 pl-4">
              Productos Destacados
            </h2>
      {/* Glow ambiental */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full blur-[110px]"
        style={{ backgroundColor: "rgba(44, 255, 5, 0.25)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full blur-[110px]"
        style={{ backgroundColor: "rgba(255, 19, 122, 0.25)" }}
      />
 
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
        {/* Columna izquierda: producto grande */}
        <div className="h-full min-h-0 w-full md:w-[70%]">
          {bigProduct && <BigCard product={bigProduct} icons={platformIcons} />}
        </div>
 
        {/* Columna derecha: mediano + 3 pequeños */}
        <div className="flex h-full min-h-0 w-full flex-col gap-3 md:w-[30%]">
          {mediumProduct && (
            <MediumCard product={mediumProduct} weight={weights[mediumProduct._id]} />
          )}
          {smallIds.map((id) => {
            const product = productsById[id];
            if (!product) return null;
            return (
              <SmallCard
                key={id}
                product={product}
                weight={weights[id]}
                onHover={() => handleHover(id)}
                onLeave={handleLeave}
                onSelect={() => handleSelect(id)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
