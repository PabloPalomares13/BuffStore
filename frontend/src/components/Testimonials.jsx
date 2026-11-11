import { useEffect, useMemo, useState } from 'react';
import { getPublicTestimonials } from '../services/ReviewService';

const Stars = ({ value }) => (
  <div className="flex gap-0.5 text-sm" aria-label={`${value} de 5 estrellas`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <span key={n} className={n <= value ? 'text-yellow-400' : 'text-white/20'}>★</span>
    ))}
  </div>
);

// Avatar con fallback a inicial si el usuario no tiene foto
const Avatar = ({ src, name }) =>
  src ? (
    <img className="size-11 rounded-full border border-white/20 object-cover" src={src} alt={name} />
  ) : (
    <div className="size-11 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white font-medium">
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );

const CreateCard = ({ card }) => (
  <div className="p-10 rounded-[20px] mx-2 w-72 shrink-0
      bg-white/10 backdrop-blur-xl border border-white/20
      shadow-[0_0_20px_rgba(0,0,0,0.4)]
      transition-all duration-200 hover:scale-105 hover:border-white/30 hover:shadow-[0_0_24px_rgba(255,19,122,0.35)]">

    <div className="flex gap-2">
      <Avatar src={card.image} name={card.name} />
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <p className="font-Urbanist font-medium text-white">{card.name}</p>
          {card.verified && (
            <svg className="mt-0.5" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Compra verificada">
              <path fillRule="evenodd" clipRule="evenodd" d="M4.555.72a4 4 0 0 1-.297.24c-.179.12-.38.202-.59.244a4 4 0 0 1-.38.041c-.48.039-.721.058-.922.129a1.63 1.63 0 0 0-.992.992c-.071.2-.09.441-.129.922a4 4 0 0 1-.041.38 1.6 1.6 0 0 1-.245.59 3 3 0 0 1-.239.297c-.313.368-.47.551-.56.743-.213.444-.213.96 0 1.404.09.192.247.375.56.743.125.146.187.219.24.297.12.179.202.38.244.59.018.093.026.189.041.38.039.48.058.721.129.922.163.464.528.829.992.992.2.071.441.09.922.129.191.015.287.023.38.041.21.042.411.125.59.245.078.052.151.114.297.239.368.313.551.47.743.56.444.213.96.213 1.404 0 .192-.09.375-.247.743-.56.146-.125.219-.187.297-.24.179-.12.38-.202.59-.244a4 4 0 0 1 .38-.041c.48-.039.721-.058.922-.129.464-.163.829-.528.992-.992.071-.2.09-.441.129-.922a4 4 0 0 1 .041-.38c.042-.21.125-.411.245-.59.052-.078.114-.151.239-.297.313-.368.47-.551.56-.743.213-.444.213-.96 0-1.404-.09-.192-.247-.375-.56-.743a4 4 0 0 1-.24-.297 1.6 1.6 0 0 1-.244-.59 3 3 0 0 1-.041-.38c-.039-.48-.058-.721-.129-.922a1.63 1.63 0 0 0-.992-.992c-.2-.071-.441-.09-.922-.129a4 4 0 0 1-.38-.041 1.6 1.6 0 0 1-.59-.245A3 3 0 0 1 7.445.72C7.077.407 6.894.25 6.702.16a1.63 1.63 0 0 0-1.404 0c-.192.09-.375.247-.743.56m4.07 3.998a.488.488 0 0 0-.691-.69l-2.91 2.91-.958-.957a.488.488 0 0 0-.69.69l1.302 1.302c.19.191.5.191.69 0z" fill="#00FF37" />
            </svg>
          )}
        </div>
        <span className="text-xs font-Urbanist text-white/40 line-clamp-1">{card.handle}</span>
      </div>
    </div>

    <div className="mt-4"><Stars value={card.rating} /></div>

    <p className="text-sm py-3 font-Urbanist text-white/70 leading-relaxed line-clamp-4">
      {card.text}
    </p>

    <div className="flex items-center justify-between font-Urbanist text-white/40 text-xs">
      <span>{card.type === 'store' ? 'Compra verificada' : 'Reseña de juego'}</span>
      <p>{new Date(card.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
    </div>
  </div>
);

const MarqueeRow = ({ cards, reverse = false }) => (
  <div className={`marquee-row w-full mx-auto max-w-7xl overflow-hidden relative ${reverse ? 'rounded-b-md' : 'rounded-t-md mt-8'}`}>
    <div className="absolute left-0 top-0 h-full w-20 md:w-32 z-10 pointer-events-none bg-gradient-to-r from-[#000000] to-transparent" />
    <div className={`marquee-inner ${reverse ? 'marquee-reverse' : ''} flex transform-gpu min-w-[200%] py-5`}>
      {[...cards, ...cards].map((card, index) => (
        <CreateCard key={`${card.id}-${index}`} card={card} />
      ))}
    </div>
    <div className="absolute right-0 top-0 h-full w-20 md:w-32 z-10 pointer-events-none bg-gradient-to-l from-[#000000] to-transparent" />
  </div>
);

// Si hay pocas reseñas, se repiten para que el marquee no quede con huecos
const fillToMin = (arr, min = 8) => {
  if (arr.length === 0) return arr;
  const out = [];
  while (out.length < min) out.push(...arr);
  return out.slice(0, Math.max(min, arr.length));
};

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getPublicTestimonials({ limit: 12 })
      .then((data) => active && setTestimonials(data))
      .catch((err) => console.error('Error cargando testimonios:', err))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  // Fila 1 en orden normal, fila 2 invertida para que no se vean idénticas
  const rowA = useMemo(() => fillToMin(testimonials), [testimonials]);
  const rowB = useMemo(() => fillToMin([...testimonials].reverse()), [testimonials]);

  // Sin reseñas reales aún: no mostramos la sección en vez de mostrar contenido falso
  if (!loading && testimonials.length === 0) return null;

  return (
    <div className="w-full my-20 bg-black relative" style={{ fontFamily: '"Urbanist", sans-serif' }}>

      {/* Opción A: animación del marquee, primer hijo del contenedor */}
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }

        .marquee-inner {
          animation: marqueeScroll 25s linear infinite;
        }

        .marquee-reverse {
          animation-direction: reverse;
        }

        .marquee-inner:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Fondos de color */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />

      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex flex-col items-start px-8 md:px-16 lg:px-24 text-sm max-w-6xl mx-auto mb-12">
          <div className="flex items-center mr-auto gap-2 text-[#00ff37] bg-[#00ff37]/20 rounded-full px-3 py-1 border border-[#00ff37]">
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.613 8.2a.62.62 0 0 1-.553-.341.59.59 0 0 1 .076-.637l6.048-6.118a.31.31 0 0 1 .375-.069c.061.033.11.084.137.147a.3.3 0 0 1 .014.197L6.537 4.991a.59.59 0 0 0 .07.552.61.61 0 0 0 .504.257h4.276a.62.62 0 0 1 .553.341.59.59 0 0 1-.076.637l-6.048 6.119a.31.31 0 0 1-.375.067.295.295 0 0 1-.15-.344l1.172-3.61a.59.59 0 0 0-.07-.553.61.61 0 0 0-.504-.257z"
                stroke="currentColor" strokeMiterlimit="5.759" strokeLinecap="round" />
            </svg>
            <span className="font-medium">Testimonios</span>
          </div>

          <h1 className="text-3xl md:text-6xl font-medium bg-gradient-to-r from-slate-100 to-slate-400 text-transparent bg-clip-text mt-4">
            La mejor prueba es la experiencia de nuestros usuarios.
          </h1>

          <p className="text-slate-400 mt-4 md:text-lg sm:text-md max-w-2xl">
            Si nuestro servicio cumplió tus expectativas, déjanos una reseña y ayúdanos a seguir mejorando.
          </p>
        </div>

        {/* Marquee */}
        {loading ? (
          <div className="px-8 md:px-16 lg:px-24 text-center text-white/40 py-12">Cargando reseñas…</div>
        ) : (
          <div className="px-8 md:px-16 lg:px-24">
            <MarqueeRow cards={rowA} />
            <MarqueeRow cards={rowB} reverse />
          </div>
        )}
      </div>
    </div>
  );
};

export default Testimonials;