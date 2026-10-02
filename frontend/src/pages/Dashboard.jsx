import { useEffect, useState } from "react";
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

// ⚠️ AJUSTA ESTOS VALORES A TU PROYECTO
const link = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : "http://localhost:3000";
const getToken = () => localStorage.getItem("userToken");
const ROUTE_NEW_PRODUCT = "/NewProduct";
const ROUTE_ORDERS = "/Listaordenes";

const PINK = "#FF137A";
const GREEN = "#00FF37";

const money = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n || 0);

const number = (n) => new Intl.NumberFormat("es-CO").format(n || 0);

const shortDate = (key) => {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
};

const PAYMENT_STATUS = {
  paid: { label: "Pagada", cls: "text-[#00FF37]" },
  pending: { label: "Pendiente", cls: "text-[#FF137A]" },
  failed: { label: "Fallida", cls: "text-white/50" },
  refunded: { label: "Reembolsada", cls: "text-white/50" },
};

// ---------- Tarjeta KPI ----------
const KpiCard = ({ label, value, alert = false }) => (
  <div className="bg-black/40 backdrop-blur-md rounded-[20px] p-5 transition-colors hover:bg-black/20">
    <div className="flex items-center justify-between">
      <p className="font-Urbanist text-sm text-white/60">{label}</p>
      {alert && (
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: PINK, boxShadow: `0 0 10px ${PINK}` }}
          aria-label="Requiere atención"
        />
      )}
    </div>
    <p className="font-Urbanist text-3xl font-bold text-white mt-2 truncate">
      {value}
    </p>
  </div>
);

const KpiSkeleton = () => (
  <div className="bg-white/10 rounded-[20px] border border-white/20 p-5 h-[104px] animate-pulse" />
);

// ---------- Tooltip de la gráfica ----------
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-[14px] px-3 py-2 font-Urbanist text-sm">
      <p className="text-white/60">{shortDate(label)}</p>
      <p className="text-white font-semibold">{money(d.revenue)}</p>
      <p className="text-white/60">{d.orders} órdenes</p>
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`${link}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setData(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "No se pudieron cargar las estadísticas. Intenta de nuevo."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const k = data?.kpis;

  return (
    <div className="relative bg-[#232323]/40 backdrop-blur-md rounded-[20px] shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] shadow-[#000000]/70 p-6 overflow-hidden"
      style={{ fontFamily: '"Urbanist", sans-serif' }}>
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#00FF37] opacity-40 blur-[180px]" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div>
            <h1 className="font-haze text-3xl sm:text-4xl uppercase text-white mb-2 tracking-wider">
              Panel de control
            </h1>
            <p className="font-Urbanist text-white/60">
              Resumen general de la tienda
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/Usuarios"
              className="font-Urbanist rounded-full px-5 py-2 text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all hover:scale-105"
            >
              Usuarios
            </Link>
            <Link
              to="/Reportes"
              className="font-Urbanist rounded-full px-5 py-2 text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all hover:scale-105"
            >
              Reportes
            </Link>
            <Link
              to="/Resenas"
              className="font-Urbanist rounded-full px-5 py-2 text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all hover:scale-105"
            >
              Reseñas
            </Link>
            <Link
              to={ROUTE_NEW_PRODUCT}
              className="font-haze uppercase rounded-full px-6 py-2 text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-[#FF137A]/20 transition-all hover:scale-105"
              style={{ boxShadow: `0 0 18px ${PINK}66` }}
            >
              Nuevo producto
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-[20px] border border-white/20 bg-white/10 p-5 font-Urbanist text-white">
            <span style={{ color: PINK }}>{error}</span>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading || !k ? (
            Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
          ) : (
            <>
              <KpiCard label="Usuarios registrados" value={number(k.totalUsers)} />
              <KpiCard label="Productos publicados" value={number(k.totalProducts)} />
              <KpiCard label="Juegos vendidos" value={number(k.unitsSold)} />
              <KpiCard label="Ingresos totales" value={money(k.revenue)} />
              <KpiCard
                label="Órdenes pendientes de pago"
                value={number(k.pendingOrders)}
                alert={k.pendingOrders > 0}
              />
              <KpiCard
                label="Reportes pendientes"
                value={number(k.pendingReports)}
                alert={k.pendingReports > 0}
              />
            </>
          )}
        </div>

        {/* Gráfica de ingresos */}
        <DashboardCard title="Ingresos de los últimos Treinta días">
          {loading ? (
            <div className="h-72 rounded-[14px] bg-white/5 animate-pulse" />
          ) : (
            <div className="h-72 [&_.recharts-area-curve]:[filter:drop-shadow(0_0_6px_#00FF37)]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data?.revenueByDay || []}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GREEN} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={shortDate}
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                    tickFormatter={(v) =>
                      v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(1)}M`
                        : v >= 1000
                        ? `${Math.round(v / 1000)}k`
                        : v
                    }
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={GREEN}
                    strokeWidth={2}
                    fill="url(#revFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardCard>

        {/* Últimas órdenes */}
        <DashboardCard
          title="Últimas órdenes"
          action={
            <Link
              to={ROUTE_ORDERS}
              className="font-Urbanist text-sm rounded-full px-4 py-1.5 text-white bg-white/10 border border-white/20 transition-colors hover:bg-white/20"
            >
              Ver todas
            </Link>
          }
        >
          {loading ? (
            <div className="h-40 rounded-[14px] bg-white/5 animate-pulse" />
          ) : !data?.recentOrders?.length ? (
            <p className="py-8 text-center text-white/40">
              Aún no hay órdenes. Cuando llegue la primera, aparecerá aquí.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-Urbanist text-sm">
                <thead>
                  <tr className="text-white/50 border-b border-white/10">
                    <th className="py-2 pr-4 font-medium">Cliente</th>
                    <th className="py-2 pr-4 font-medium">Total</th>
                    <th className="py-2 pr-4 font-medium">Pago</th>
                    <th className="py-2 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => {
                    const st = PAYMENT_STATUS[o.paymentStatus] || {
                      label: o.paymentStatus,
                      cls: "text-white/50",
                    };
                    return (
                      <tr key={o._id} className="border-b border-white/5 last:border-0">
                        <td className="py-3 pr-4">
                          <p className="text-white">{o.customer?.fullName || "—"}</p>
                          <p className="text-white/40 text-xs">{o.customer?.email}</p>
                        </td>
                        <td className="py-3 pr-4 text-white whitespace-nowrap">
                          {money(o.totals?.total)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-block rounded-full border border-white/20 bg-white/5 px-3 py-0.5 text-xs ${st.cls}`}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3 text-white/60 whitespace-nowrap">
                          {new Date(o.createdAt).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
};

export default Dashboard;