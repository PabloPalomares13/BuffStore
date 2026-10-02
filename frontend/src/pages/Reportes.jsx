import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
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

const TYPE_LABELS = {
  queja: "Queja",
  reclamo: "Reclamo",
  sugerencia: "Sugerencia",
  falla_producto: "Falla de producto",
  falla_sitio: "Falla del sitio",
};

const STATUS_META = {
  open: { label: "Pendiente", color: PINK },
  in_review: { label: "En revisión", color: "rgba(255,255,255,0.8)" },
  closed: { label: "Cerrado", color: GREEN },
};

// Acciones disponibles según el estado actual
const ACTIONS = {
  open: [
    { to: "in_review", label: "Marcar en revisión" },
    { to: "closed", label: "Cerrar" },
  ],
  in_review: [
    { to: "closed", label: "Cerrar" },
    { to: "open", label: "Devolver a pendiente" },
  ],
  closed: [{ to: "open", label: "Reabrir" }],
};

const TABS = [
  { key: "open", label: "Pendientes" },
  { key: "in_review", label: "En revisión" },
  { key: "closed", label: "Cerrados" },
  { key: "", label: "Todos" },
];

const formatDate = (d) =>
  new Date(d).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const money = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

const Reportes = () => {
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState({ open: 0, in_review: 0, closed: 0 });
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);

  const [status, setStatus] = useState("open");
  const [type, setType] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [expanded, setExpanded] = useState({}); // id -> bool

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${link}/api/admin/reports`, {
        ...authHeaders(),
        params: { status, type, page, limit: LIMIT },
      });
      setReports(data.reports);
      setCounts(data.counts);
      setPages(data.pages);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  }, [status, type, page]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (report, to) => {
    setUpdatingId(report._id);
    setNotice("");
    setError("");
    try {
      const { data } = await axios.patch(
        `${link}/api/admin/reports/${report._id}/status`,
        { status: to },
        authHeaders()
      );
      setNotice(data.message);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar el reporte.");
    } finally {
      setUpdatingId(null);
    }
  };

  const selectCls =
    "font-Urbanist rounded-full px-4 py-2 text-white bg-white/10 border border-white/20 backdrop-blur-md focus:outline-none focus:border-white/50 [&>option]:bg-black";

  return (
    <div className="relative bg-[#232323]/40 backdrop-blur-md rounded-[20px] min-h-screen shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] shadow-[#000000]/70 p-6 overflow-hidden"
      style={{ fontFamily: '"Urbanist", sans-serif' }}>
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />
      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div>
            <h1 className="font-haze text-3xl sm:text-4xl uppercase text-white mb-2 tracking-wider">Reportes</h1>
            <p className="font-Urbanist text-white/60">
              Quejas, reclamos y sugerencias de los usuarios
            </p>
          </div>
          <Link to="/Dashboard" className={`font-Urbanist rounded-full px-5 py-2 text-white ${glass}`}>
            Volver al panel
          </Link>
        </div>

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

        {/* Pestañas + filtro por tipo */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2 flex-1">
            {TABS.map((t) => {
              const active = status === t.key;
              const n = t.key ? counts[t.key] : counts.open + counts.in_review + counts.closed;
              return (
                <button
                  key={t.key || "all"}
                  onClick={() => {
                    setStatus(t.key);
                    setPage(1);
                  }}
                  className={`font-Urbanist rounded-full px-4 py-2 text-sm text-white border transition-all ${
                    active ? "bg-white/20 border-white/50" : "bg-white/10 border-white/20 hover:bg-white/15"
                  }`}
                >
                  {t.label} <span className="text-white/50">({n})</span>
                </button>
              );
            })}
          </div>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className={selectCls}
          >
            <option value="">Todos los tipos</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 rounded-[20px] bg-white/10 border border-white/20 animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <DashboardCard>
            <p className="py-10 text-center text-white/40">
              {status === "open"
                ? "No hay reportes pendientes. Todo al día."
                : "No hay reportes con estos filtros."}
            </p>
          </DashboardCard>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => {
              const meta = STATUS_META[r.status];
              const isOpen = !!expanded[r._id];
              const long = r.message.length > 220;
              return (
                <div
                  key={r._id}
                  className="rounded-[20px] border border-white/20 bg-black/40 backdrop-blur-md p-5 font-Urbanist"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/20 bg-white/5 px-3 py-0.5 text-xs text-white/80">
                        {TYPE_LABELS[r.type] || r.type}
                      </span>
                      <span
                        className="rounded-full border border-white/20 bg-white/5 px-3 py-0.5 text-xs"
                        style={{ color: meta.color }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <span className="text-xs text-white/40">{formatDate(r.createdAt)}</span>
                  </div>

                  <p className="mt-3 text-sm text-white/50">
                    De{" "}
                    <span className="text-white">
                      {r.user ? r.user.fullName || r.user.nickname || r.user.email : "Usuario eliminado"}
                    </span>
                    {r.user?.email && r.user.fullName ? ` · ${r.user.email}` : ""}
                  </p>

                  <p className={`mt-2 text-white/85 whitespace-pre-line ${!isOpen && long ? "line-clamp-3" : ""}`}>
                    {r.message}
                  </p>
                  {long && (
                    <button
                      onClick={() => setExpanded((e) => ({ ...e, [r._id]: !isOpen }))}
                      className="mt-1 text-xs text-white/50 hover:text-white transition-colors"
                    >
                      {isOpen ? "Ver menos" : "Ver más"}
                    </button>
                  )}

                  {(r.relatedProductId || r.relatedOrderId) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                      {r.relatedProductId && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          Producto: {r.relatedProductId.name || "—"}
                        </span>
                      )}
                      {r.relatedOrderId && (
                        <Link
                          to={`/Detallesorden/${r.relatedOrderId._id}`}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10 transition-colors"
                        >
                          Orden: {money(r.relatedOrderId.totals?.total)}
                        </Link>
                      )}
                    </div>
                  )}

                  {r.chatSummary && isOpen && (
                    <div className="mt-3 rounded-[14px] border border-white/10 bg-black/40 p-3 text-sm text-white/60">
                      <p className="text-xs text-white/40 mb-1">Resumen del chat</p>
                      {r.chatSummary}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {ACTIONS[r.status].map((a) => (
                      <button
                        key={a.to}
                        disabled={updatingId === r._id}
                        onClick={() => changeStatus(r, a.to)}
                        className={`rounded-full px-4 py-1.5 text-sm text-white hover:scale-105 disabled:opacity-50 ${glass}`}
                        style={a.to === "closed" ? { boxShadow: `0 0 12px ${GREEN}55` } : undefined}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación */}
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
      </div>
    </div>
  );
};

export default Reportes;