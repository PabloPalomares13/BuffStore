import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import DashboardCard from "../components/ui/DashboardCard";
import logoMarca from "../assets/BLogo4K-white.png";

// ⚠️ Misma configuración que usa el resto del proyecto
const link = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : "http://localhost:3000";
const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
});

const PINK = "#FF137A";
const GREEN = "#00FF37";
const LIMIT = 10;

const glass =
  "bg-white/10 backdrop-blur-md border border-white/20 transition-colors hover:bg-white/20";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const monthLabel = (key) => MONTHS[parseInt(key.split("-")[1], 10) - 1];

const Stars = ({ value }) => (
  <span aria-label={`${value} de 5 estrellas`} className="tracking-wider">
    <span className="text-white">{"★".repeat(value)}</span>
    <span className="text-white/25">{"★".repeat(5 - value)}</span>
  </span>
);

const authorName = (u) =>
  u ? u.fullName || u.nickname || u.email : "Usuario eliminado";

// ===================================================================
// Pestaña 1: reseñas de juegos
// ===================================================================
const ReviewsTab = () => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ total: 0, average: 0 });
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${link}/api/admin/reviews`, {
        ...authHeaders(),
        params: { rating, search, page, limit: LIMIT },
      });
      setReviews(data.reviews);
      setSummary(data.summary);
      setPages(data.pages);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar las reseñas.");
    } finally {
      setLoading(false);
    }
  }, [rating, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Reutiliza el endpoint existente: ya permite admin y recalcula el promedio del producto
  const confirmDelete = async () => {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await axios.delete(`${link}/api/reviews/${toDelete._id}`, authHeaders());
      setNotice("Reseña eliminada.");
      setToDelete(null);
      await load();
    } catch (err) {
      setToDelete(null);
      setError(err.response?.data?.message || "No se pudo eliminar la reseña.");
    } finally {
      setBusy(false);
    }
  };

  const selectCls =
    "font-Urbanist rounded-full px-4 py-2 text-white bg-white/10 border border-white/20 backdrop-blur-md focus:outline-none focus:border-white/50 [&>option]:bg-black";

  return (
    <div className="space-y-5">
      <p className="font-Urbanist text-white/60">
        {summary.total} reseñas en total · promedio general{" "}
        <span className="text-white">{summary.average || 0} / 5</span>
      </p>

      {error && (
        <div className="rounded-[20px] border border-white/20 bg-white/10 p-4 font-Urbanist" style={{ color: PINK }}>
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-[20px] border border-white/20 bg-white/10 p-4 font-Urbanist" style={{ color: GREEN }}>
          {notice}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en el texto de las reseñas"
          className="flex-1 min-w-[220px] font-Urbanist rounded-full px-5 py-2 text-white placeholder-white/40 bg-white/10 border border-white/20 backdrop-blur-md focus:outline-none focus:border-white/50"
        />
        <select
          value={rating}
          onChange={(e) => {
            setRating(e.target.value);
            setPage(1);
          }}
          className={selectCls}
        >
          <option value="">Todas las calificaciones</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "estrella" : "estrellas"}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-[20px] bg-white/10 border border-white/20 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <DashboardCard>
          <p className="py-10 text-center text-white/40">No hay reseñas con estos filtros.</p>
        </DashboardCard>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r._id}
              className="rounded-[20px] border border-white/20 bg-black/40 backdrop-blur-md p-5 font-Urbanist"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Stars value={r.rating} />
                  {r.product ? (
                    <Link
                      to={`/product/${r.product._id}`}
                      className="text-white hover:underline underline-offset-4"
                    >
                      {r.product.name || "Producto sin nombre"}
                    </Link>
                  ) : (
                    <span className="text-white/40">Producto eliminado</span>
                  )}
                </div>
                <span className="text-xs text-white/40">
                  {formatDate(r.createdAt)}
                  {r.isEdited && " · editada"}
                </span>
              </div>

              <p className="mt-2 text-sm text-white/50">
                Por <span className="text-white">{authorName(r.user)}</span>
                {r.user?.email && r.user.fullName ? ` · ${r.user.email}` : ""}
              </p>
              <p className="mt-2 text-white/85 whitespace-pre-line">{r.text}</p>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setToDelete(r)}
                  className="rounded-full px-4 py-1.5 text-sm text-white bg-white/10 border border-white/20 transition-all hover:scale-105"
                  style={{ boxShadow: `0 0 12px ${PINK}55` }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between font-Urbanist text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className={`rounded-full px-4 py-1.5 text-white disabled:opacity-30 ${glass}`}
          >
            Anterior
          </button>
          <span className="text-white/60">
            Página {page} de {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className={`rounded-full px-4 py-1.5 text-white disabled:opacity-30 ${glass}`}
          >
            Siguiente
          </button>
        </div>
      )}

      {toDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-[20px] border border-white/20 bg-black/80 backdrop-blur-md p-6">
            <h3 className="font-haze text-xl uppercase text-white">Eliminar reseña</h3>
            <p className="font-Urbanist text-white/70 mt-3">
              Se eliminará la reseña de {authorName(toDelete.user)} y se recalculará la calificación
              del juego. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setToDelete(null)}
                disabled={busy}
                className={`font-Urbanist rounded-full px-5 py-2 text-white ${glass}`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={busy}
                className="font-haze uppercase rounded-full px-5 py-2 text-white bg-white/10 border border-white/20 transition-all hover:scale-105 disabled:opacity-50"
                style={{ boxShadow: `0 0 16px ${PINK}88` }}
              >
                {busy ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================================================================
// Pestaña 2: feedback de la tienda
// ===================================================================
const StatCard = ({ label, value }) => (
  <div className="bg-white/10 backdrop-blur-md rounded-[20px] border border-white/20 p-5">
    <p className="font-Urbanist text-sm text-white/60">{label}</p>
    <p className="font-Urbanist text-3xl font-bold text-white mt-2">
      {value || 0}
      <span className="text-base font-normal text-white/40"> / 5</span>
    </p>
  </div>
);

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-[14px] px-3 py-2 font-Urbanist text-sm">
      <p className="text-white/60">{monthLabel(label)}</p>
      <p className="text-white font-semibold">{d.avg ?? "Sin datos"}</p>
      <p className="text-white/60">{d.total} respuestas</p>
    </div>
  );
};

const FeedbackTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${link}/api/admin/feedback`, {
          ...authHeaders(),
          params: { limit: 10 },
        });
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "No se pudo cargar el feedback.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="h-72 rounded-[20px] bg-white/10 border border-white/20 animate-pulse" />;
  }
  if (error) {
    return (
      <div className="rounded-[20px] border border-white/20 bg-white/10 p-4 font-Urbanist" style={{ color: PINK }}>
        {error}
      </div>
    );
  }

  const { averages, trend, latest } = data;

  if (!averages.total) {
    return (
      <DashboardCard>
        <p className="py-10 text-center text-white/40">
          Aún no hay feedback de la tienda. Aparecerá aquí cuando los clientes califiquen sus compras.
        </p>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={`General (${averages.total} respuestas)`} value={averages.overall} />
        <StatCard label="Facilidad de compra" value={averages.purchaseEase} />
        <StatCard label="Velocidad de entrega" value={averages.deliverySpeed} />
        <StatCard label="Confianza al pagar" value={averages.paymentTrust} />
      </div>

      <DashboardCard title="Tendencia (últimos 6 meses)">
        <div className="h-56 [&_.recharts-area-curve]:[filter:drop-shadow(0_0_6px_#00FF37)]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fbFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GREEN} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={monthLabel}
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<TrendTooltip />} />
              <Area
                type="monotone"
                dataKey="avg"
                stroke={GREEN}
                strokeWidth={2}
                fill="url(#fbFill)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>

      <DashboardCard title="Últimas opiniones">
        <ul className="divide-y divide-white/5 font-Urbanist text-sm">
          {latest.map((f) => (
            <li key={f._id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-white">{authorName(f.user)}</span>
                <span className="text-xs text-white/40">{formatDate(f.createdAt)}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-white/60">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5">
                  Compra {f.ratings.purchaseEase}/5
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5">
                  Entrega {f.ratings.deliverySpeed}/5
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5">
                  Confianza {f.ratings.paymentTrust}/5
                </span>
              </div>
              <p className={`mt-2 ${f.comment ? "text-white/85" : "text-white/30"}`}>
                {f.comment || "Sin comentario"}
              </p>
            </li>
          ))}
        </ul>
      </DashboardCard>
    </div>
  );
};

// ===================================================================
// Página
// ===================================================================
const Resenas = () => {
  const [tab, setTab] = useState("reviews");

  return (
    <div className="relative bg-[#232323]/40 backdrop-blur-md rounded-[20px] min-h-screen shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] shadow-[#000000]/70 p-6 overflow-hidden"
      style={{ fontFamily: '"Urbanist", sans-serif' }}>
        <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />
      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div>
            <h1 className="font-haze text-3xl sm:text-4xl uppercase text-white mb-2 tracking-widest">Reseñas</h1>
            <p className="font-Urbanist text-white/60">
              Modera las reseñas de juegos y revisa la opinión de los clientes sobre la tienda
            </p>
          </div>
          <Link to="/Dashboard" className={`font-Urbanist rounded-full px-5 py-2 text-white ${glass}`}>
            Volver al panel
          </Link>
        </div>

        <div className="flex gap-2">
          {[
            { key: "reviews", label: "Reseñas de juegos" },
            { key: "feedback", label: "Feedback de la tienda" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`font-Urbanist rounded-full px-5 py-2 text-sm text-white border transition-all ${
                tab === t.key ? "bg-white/20 border-white/50" : "bg-white/10 border-white/20 hover:bg-white/15"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "reviews" ? <ReviewsTab /> : <FeedbackTab />}
      </div>
    </div>
  );
};

export default Resenas;