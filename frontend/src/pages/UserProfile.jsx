import { useEffect, useState } from "react";
import axios from "axios";
import {User,Mail,Phone,Cake,FileText,Pencil,Lock,ShoppingBag,Heart,CreditCard,MessageSquare,ShieldCheck,KeyRound,Gamepad2,Star,Calendar,Hash,Check,X,Plus,Trash2,Loader2,Camera,} from "lucide-react";
import logo from "../assets/BLogo4k-white.png";
const link = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : "http://localhost:3000";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
});

// Convierte cada orden (que puede traer varios productos) en filas planas
// {id, orderId, date, product, image, price, quantity, productId, delivered}
// listas para renderizar en el historial de compras.
function flattenOrders(orders) {
  return orders.flatMap((order) =>
    (order.products || []).map((item, index) => {
      const product =
        item.productId && typeof item.productId === "object"
          ? item.productId
          : null;
      const image =
        product?.media?.find((m) => m.type === "image")?.url ||
        product?.images?.[0] ||
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop";

      return {
        id: `${order._id}_${index}`,
        orderId: order._id,
        productId: product?._id || item.productId,
        date: order.createdAt,
        product: item.name,
        image,
        price: item.price,
        quantity: item.quantity,
      };
    })
  );
}

// Deriva "métodos de pago" a partir del historial de órdenes, ya que aún
// no existe un modelo PaymentMethod dedicado en el backend.
function derivePaymentMethods(orders) {
  const map = new Map();
  orders.forEach((order) => {
    const last4 = order.payment?.cardLast4;
    if (!last4) return;
    map.set(last4, {
      id: last4,
      brand: "Tarjeta",
      last4,
      holder: order.payment?.cardName || order.customer?.fullName || "",
    });
  });
  return Array.from(map.values());
}

// Tu GET /api/favorites devuelve un array de productos ya populados
// (favorites.map(f => f.productId)). Lo transformamos a {id, name, price, image}.
function normalizeFavorites(products) {
  return (products || [])
    .filter(Boolean) // por si algún producto fue eliminado (populate da null)
    .map((product) => ({
      id: product._id,
      name: product.name,
      price: product.price,
      image:
        product.media?.find((m) => m.type === "image")?.url ||
        product.images?.[0] ||
        "",
    }));
}

const mockReviews = [
  {
    productId: "p_gta6",
    product: "Grand Theft Auto VI",
    rating: 5,
    comment:
      "La entrega del código fue casi inmediata y el juego corre perfecto en PS5.",
    date: "2026-09-03",
  },
  {
    productId: "p_gamepass",
    product: "Game Pass Ultimate · 3 meses",
    rating: 4,
    comment:
      "Buen precio comparado con la tienda oficial, solo tardó un poco la activación.",
    date: "2026-07-15",
  },
];

const formatCOP = (value) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });

/* ------------------------------------------------------------------
   PRIMITIVOS DE ESTILO
------------------------------------------------------------------- */

function GlowBackdrop() {
  return (
    <div className="pointer-events-none inset-0 overflow-hidden bg-black">
      <div
        className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full opacity-40 blur-[120px]"
        style={{ backgroundColor: "#FF137A" }}
      />
      <div
        className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full opacity-40 blur-[120px]"
        style={{ backgroundColor: "#00FF37" }}
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]">
        <img src={logo} className="blur-[2px] text-white h-320 w-320 mt-28" />
      </div>
    </div>
  );
}

function GlassPanel({ children, className = "" }) {
  return (
    <div
      className={`rounded-[20px] border border-white/15 bg-white/[0.06] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function PillButton({ children, icon: Icon, variant = "neutral", ...props }) {
  const variants = {
    neutral:
      "border-white/20 bg-white/10 text-white/90 hover:bg-white/15",
    pink:
      "border-[#FF137A]/50 bg-[#FF137A]/10 text-[#FF7FB8] shadow-[0_0_18px_-4px_#FF137A] hover:bg-[#FF137A]/15",
    green:
      "border-[#00FF37]/50 bg-[#00FF37]/10 text-[#7CFF9B] shadow-[0_0_18px_-4px_#00FF37] hover:bg-[#00FF37]/15",
  };
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-Urbanist text-sm transition-colors hover:scale-105 ${variants[variant]}`}
      {...props}
    >
      {Icon && <Icon size={16} className={props.disabled ? "animate-spin" : ""} />}
      {children}
    </button>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="font-haze text-xl tracking-wide text-white">{children}</h2>
  );
}

/* ------------------------------------------------------------------
   NAVEGACIÓN LATERAL
------------------------------------------------------------------- */

const TABS = [
  { id: "perfil", label: "Datos personales", icon: User },
  { id: "compras", label: "Historial de compras", icon: ShoppingBag },
  { id: "favoritos", label: "Favoritos", icon: Heart },
  { id: "pagos", label: "Métodos de pago", icon: CreditCard },
  { id: "resenas", label: "Mis reseñas", icon: MessageSquare },
  { id: "seguridad", label: "Seguridad", icon: ShieldCheck },
];

function SideNav({ active, onChange }) {
  return (
    <GlassPanel className="p-3 md:sticky md:top-24">
      <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 font-Urbanist text-sm transition-colors md:w-full ${
                isActive
                  ? "border border-[#FF137A]/50 bg-[#FF137A]/10 text-white shadow-[0_0_16px_-6px_#FF137A]"
                  : "border border-transparent text-white/60 hover:bg-white/5 hover:text-white/90"
              }`}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </GlassPanel>
  );
}

/* ------------------------------------------------------------------
   CABECERA
------------------------------------------------------------------- */

function ProfileHeader({ user, onAvatarUpdated }) {
  const [uploading, setUploading] = useState(false);
 
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
 
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
 
      const res = await axios.post(`${link}/api/auth/avatar`, formData, {
        headers: {
          ...authHeader().headers,
          "Content-Type": "multipart/form-data",
        },
      });
 
      onAvatarUpdated(res.data.avatarUrl);
    } catch (err) {
      console.error("Error al subir la foto de perfil:", err);
      alert(
        err.response?.data?.message ||
          "No se pudo subir la foto. Intenta de nuevo."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
 
  return (
    <GlassPanel className="relative overflow-hidden p-6 md:p-8">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="relative shrink-0">
          <label
            htmlFor="avatar-upload"
            className="group relative block h-40 w-40 cursor-pointer overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-[#FF137A]/30 to-[#00FF37]/30 shadow-[0_0_24px_-6px_#FF137A]"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || user.email}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Gamepad2 size={40} className="text-white/80" />
              </div>
            )}
 
            {/* Overlay que aparece en hover para cambiar la foto */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
              {uploading ? (
                <Loader2 size={22} className="animate-spin text-white" />
              ) : (
                <Camera size={30} className="text-white" />
              )}
            </div>
 
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={uploading}
            />
          </label>
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-black bg-[#00FF37] shadow-[0_0_10px_#00FF37]" />
        </div>
 
        <div>
          <h1 className="font-haze text-2xl tracking-wide text-white md:text-3xl">
            {user.fullName || user.email}
          </h1>
          {user.nickname && (
            <p className="mt-1 font-Urbanist text-sm text-white/50">
              @{user.nickname}
            </p>
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-Urbanist text-xs text-white/70">
              {user.role === "admin" ? "Administrador" : "Jugador"}
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-Urbanist text-xs text-white/70">
              Miembro desde{" "}
              {new Date(user.createdAt).toLocaleDateString("es-CO", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

/* ------------------------------------------------------------------
   TAB: DATOS PERSONALES
------------------------------------------------------------------- */

function LockedField({ icon: Icon, label, value, onChange, type = "text", editing }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 font-Urbanist text-xs text-white/50">
        <Icon size={14} />
        {label}
      </label>
      <input
        type={type}
        value={value}
        disabled={!editing}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-full border px-4 py-2.5 font-Urbanist text-sm outline-none transition-colors ${
          editing
            ? "border-[#00FF37]/40 bg-white/5 text-white shadow-[0_0_14px_-6px_#00FF37]"
            : "border-white/10 bg-black/30 text-white/50"
        }`}
      />
    </div>
  );
}
 
function PersonalDataTab({ user, onSave, saving }) {
  const initialForm = {
    email: user.email || "",
    phone: user.phone || "",
    fullName: user.fullName || "",
    nickname: user.nickname || "",
    birthDate: user.birthDate ? user.birthDate.slice(0, 10) : "",
    billingAddress: user.billingAddress || "",
  };
 
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(false);
 
  const setField = (field) => (value) =>
    setForm((prev) => ({ ...prev, [field]: value }));
 
  const handleCancel = () => {
    setForm(initialForm);
    setEditing(false);
  };
 
  const handleSave = async () => {
    await onSave(form);
    setEditing(false);
  };
 
  return (
    <GlassPanel className="p-6 md:p-8">
      <div className="flex items-center justify-between gap-4 ">
        <SectionTitle>Datos personales</SectionTitle>
      </div>
      <p className="mt-1 font-Urbanist text-sm text-white/50">
        {editing
          ? "Modifica los campos que necesites y guarda los cambios."
          : "Usa el botón Editar para habilitar todos los campos."}
      </p>
 
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <LockedField
          icon={FileText}
          label="Nombre de usuario"
          value={form.fullName}
          onChange={setField("fullName")}
          editing={editing}
        />
        <LockedField
          icon={Cake}
          label="Nickname"
          value={form.nickname}
          onChange={setField("nickname")}
          placeholder="@nickname"
          editing={editing}
        />
        <LockedField
          icon={Mail}
          label="Correo electrónico"
          value={form.email}
          onChange={setField("email")}
          type="email"
          editing={editing}
        />
        <LockedField
          icon={Phone}
          label="Número de teléfono"
          value={form.phone}
          onChange={setField("phone")}
          type="tel"
          editing={editing}
        />
        <LockedField
          icon={Cake}
          label="Fecha de nacimiento"
          value={form.birthDate}
          onChange={setField("birthDate")}
          type="date"
          editing={editing}
        />
        
      </div>
 
      {!editing && (
        <div className="mt-7 flex justify-end">
          <PillButton icon={Pencil} variant="neutral" onClick={() => setEditing(true)}>
            Editar
          </PillButton>
        </div>
      )}
 
      {editing && (
        <div className="mt-7 flex justify-end gap-3">
          <PillButton icon={X} variant="pink" onClick={handleCancel} disabled={saving}>
            Cancelar
          </PillButton>
          <PillButton
            icon={saving ? Loader2 : Check}
            variant="green"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </PillButton>
        </div>
      )}
    </GlassPanel>
  );
}

/* ------------------------------------------------------------------
   TAB: HISTORIAL DE COMPRAS
------------------------------------------------------------------- */

function OrderCard({ order, onRequestCode }) {
  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-white/10 bg-black/30 p-4 transition-colors hover:bg-black/20 sm:flex-row sm:items-center">
      <img
        src={order.image}
        alt={order.product}
        className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-Urbanist text-base text-white">
          {order.product}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-Urbanist text-xs text-white/50">
          <span className="flex items-center gap-1">
            <Calendar size={13} /> {formatDateTime(order.date)}
          </span>
          <span className="flex items-center gap-1">
            <Hash size={13} /> {order.orderId.slice(-6).toUpperCase()}
          </span>
          <span>Cantidad: {order.quantity}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
        <p className="font-Urbanist text-lg text-white">
          {formatCOP(order.price)}
        </p>
        {order.code ? (
          <span className="rounded-full border border-[#00FF37]/40 bg-[#00FF37]/10 px-4 py-2 font-Urbanist text-sm text-[#7CFF9B] shadow-[0_0_14px_-6px_#00FF37]">
            {order.code}
          </span>
        ) : (
          <PillButton
            icon={KeyRound}
            variant="pink"
            onClick={() => onRequestCode(order)}
          >
            Solicitar código del juego
          </PillButton>
        )}
      </div>
    </div>
  );
}

function OrdersTab({ orders, onRequestCode }) {
  return (
    <GlassPanel className="p-6 md:p-8">
      <SectionTitle>Historial de compras</SectionTitle>
      <p className="mt-1 font-Urbanist text-sm text-white/50">
        {orders.length} productos comprados en tu cuenta.
      </p>
      {orders.length === 0 ? (
        <p className="mt-6 font-Urbanist text-sm text-white/40">
          Aún no tienes compras registradas.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onRequestCode={onRequestCode} />
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

/* ------------------------------------------------------------------
   TAB: FAVORITOS
------------------------------------------------------------------- */

function FavoritesTab({ favorites, onRemove }) {
  return (
    <GlassPanel className="p-6 md:p-8">
      <SectionTitle>Favoritos</SectionTitle>
      <p className="mt-1 font-Urbanist text-sm text-white/50">
        Productos que has guardado para más tarde.
      </p>
      {favorites.length === 0 ? (
        <p className="mt-6 font-Urbanist text-sm text-white/40">
          Aún no has agregado productos a favoritos.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {favorites.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-black/30"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <button
                onClick={() => onRemove(item.id)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-[#FF137A]/50 bg-black/50 text-[#FF137A] shadow-[0_0_12px_-4px_#FF137A] backdrop-blur transition-colors hover:bg-black/70"
                aria-label="Quitar de favoritos"
              >
                <Heart size={14} fill="currentColor" />
              </button>
              <div className="p-3">
                <p className="truncate font-Urbanist text-sm text-white">
                  {item.name}
                </p>
                <p className="mt-0.5 font-Urbanist text-sm text-white/50">
                  {formatCOP(item.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

/* ------------------------------------------------------------------
   TAB: MÉTODOS DE PAGO
------------------------------------------------------------------- */

function PaymentMethodsTab({ methods }) {
  return (
    <GlassPanel className="p-6 md:p-8">
      <div className="flex items-center justify-between">
        <SectionTitle>Métodos de pago</SectionTitle>
        <PillButton icon={Plus} variant="green">
          Agregar tarjeta
        </PillButton>
      </div>

      <div className="mt-6 space-y-3">
        {methods.map((pm) => (
          <div
            key={pm.id}
            className="flex items-center justify-between rounded-[20px] border border-white/10 bg-black/30 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5">
                <CreditCard size={18} className="text-white/70" />
              </div>
              <div>
                <p className="font-Urbanist text-sm text-white">
                  {pm.brand} •••• {pm.last4}
                </p>
                <p className="font-Urbanist text-xs text-white/40">
                  {pm.holder}
                </p>
              </div>
            </div>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/40 transition-colors hover:border-[#FF137A]/40 hover:text-[#FF137A]"
              aria-label="Eliminar método de pago"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

/* ------------------------------------------------------------------
   TAB: RESEÑAS
------------------------------------------------------------------- */

function ReviewsTab({ reviews }) {
  return (
    <GlassPanel className="p-6 md:p-8">
      <SectionTitle>Mis reseñas</SectionTitle>
      <p className="mt-1 font-Urbanist text-sm text-white/50">
        Reseñas que has dejado en productos comprados. Datos de ejemplo.
      </p>

      <div className="mt-6 space-y-4">
        {reviews.map((review) => (
          <div
            key={review.productId}
            className="rounded-[20px] border border-white/10 bg-black/30 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-Urbanist text-sm text-white">
                {review.product}
              </p>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={
                      i < review.rating
                        ? "fill-[#FF137A] text-[#FF137A]"
                        : "text-white/15"
                    }
                  />
                ))}
              </div>
            </div>
            <p className="mt-2 font-Urbanist text-sm text-white/60">
              {review.comment}
            </p>
            <p className="mt-2 font-Urbanist text-xs text-white/30">
              {new Date(review.date).toLocaleDateString("es-CO")} · ID
              producto: {review.productId}
            </p>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

/* ------------------------------------------------------------------
   TAB: SEGURIDAD
------------------------------------------------------------------- */

function SecurityTab() {
  const [open, setOpen] = useState(false);
  return (
    <GlassPanel className="p-6 md:p-8">
      <SectionTitle>Seguridad</SectionTitle>
      <p className="mt-1 font-Urbanist text-sm text-white/50">
        Gestiona el acceso a tu cuenta.
      </p>

      <div className="mt-6 flex items-center justify-between rounded-[20px] border border-white/10 bg-black/30 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5">
            <Lock size={17} className="text-white/70" />
          </div>
          <div>
            <p className="font-Urbanist text-sm text-white">Contraseña</p>
            <p className="font-Urbanist text-xs text-white/40">
              Última actualización hace 3 meses
            </p>
          </div>
        </div>
        <PillButton icon={KeyRound} variant="pink" onClick={() => setOpen(true)}>
          Cambiar contraseña
        </PillButton>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <GlassPanel className="w-full max-w-sm bg-black/70 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-haze text-lg text-white">
                Cambiar contraseña
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-white/50 transition-colors hover:text-white"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              <input
                type="password"
                placeholder="Contraseña actual"
                className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2.5 font-Urbanist text-sm text-white outline-none placeholder:text-white/30 focus:border-[#00FF37]/40"
              />
              <input
                type="password"
                placeholder="Nueva contraseña"
                className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2.5 font-Urbanist text-sm text-white outline-none placeholder:text-white/30 focus:border-[#00FF37]/40"
              />
              <input
                type="password"
                placeholder="Confirmar nueva contraseña"
                className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2.5 font-Urbanist text-sm text-white outline-none placeholder:text-white/30 focus:border-[#00FF37]/40"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <PillButton onClick={() => setOpen(false)}>Cancelar</PillButton>
              <PillButton icon={Check} variant="green" onClick={() => setOpen(false)}>
                Actualizar
              </PillButton>
            </div>
          </GlassPanel>
        </div>
      )}
    </GlassPanel>
  );
}

/* ------------------------------------------------------------------
   COMPONENTE PRINCIPAL
------------------------------------------------------------------- */

export default function UserProfilePrototype() {
  const [activeTab, setActiveTab] = useState("perfil");

  const [user, setUser] = useState(null);
  const [rawOrders, setRawOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, ordersRes, favoritesRes] = await Promise.all([
          axios.get(`${link}/api/auth/profile`, authHeader()),
          axios.get(`${link}/api/orders/my-orders`, authHeader()),
          axios.get(`${link}/api/favoritos`, authHeader()),
        ]);

        setUser(profileRes.data);
        setRawOrders(ordersRes.data);
        setOrders(flattenOrders(ordersRes.data));
        setFavorites(normalizeFavorites(favoritesRes.data));
      } catch (err) {
        console.error("Error al cargar el perfil:", err);
        setError("No se pudo cargar tu información. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const handleSaveProfile = async (form) => {
    setSaving(true);
    try {
      const res = await axios.put(
        `${link}/api/auth/profile`,
        form,
        authHeader()
      );
      setUser(res.data);
    } catch (err) {
      console.error("Error al guardar el perfil:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFavorite = async (productId) => {
    setFavorites((prev) => prev.filter((f) => f.id !== productId));
    try {
      await axios.delete(`${link}/api/favoritos/${productId}`, authHeader());
    } catch (err) {
      console.error("Error al quitar favorito:", err);
    }
  };

  const handleRequestCode = async (order) => {
    try {
      const res = await axios.post(
        `${link}/api/codes/request`,
        { orderId: order.orderId, productId: order.productId },
        authHeader()
      );
      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id ? { ...item, code: res.data.code } : item
        )
      );
    } catch (err) {
      console.error("Error al solicitar el código:", err);
      alert(
        err.response?.data?.message || "No se pudo obtener el código. Intenta de nuevo."
      );
    }
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <GlowBackdrop />
        <div className="relative flex items-center gap-3 font-Urbanist text-white/70">
          <Loader2 size={20} className="animate-spin" />
          Cargando tu perfil...
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <GlowBackdrop />
        <p className="relative font-Urbanist text-white/70">
          {error || "No se pudo cargar el perfil del usuario."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-28">
      <GlowBackdrop />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-10 md:pt-16">
        <ProfileHeader
          user={user}
          onAvatarUpdated={(avatarUrl) =>
            setUser((prev) => ({ ...prev, avatarUrl }))
          }
        />

        <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
          <SideNav active={activeTab} onChange={setActiveTab} />

          <div>
            {activeTab === "perfil" && (
              <PersonalDataTab
                user={user}
                onSave={handleSaveProfile}
                saving={saving}
              />
            )}
            {activeTab === "compras" && (
              <OrdersTab orders={orders} onRequestCode={handleRequestCode} />
            )}
            {activeTab === "favoritos" && (
              <FavoritesTab
                favorites={favorites}
                onRemove={handleRemoveFavorite}
              />
            )}
            {activeTab === "pagos" && (
              <PaymentMethodsTab methods={derivePaymentMethods(rawOrders)} />
            )}
            {activeTab === "resenas" && <ReviewsTab reviews={mockReviews} />}
            {activeTab === "seguridad" && <SecurityTab />}
          </div>
        </div>
      </div>
    </div>
  );
}