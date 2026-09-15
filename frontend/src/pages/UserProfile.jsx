import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Cake,
  FileText,
  Pencil,
  Lock,
  ShoppingBag,
  Heart,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  KeyRound,
  Gamepad2,
  Star,
  Calendar,
  Hash,
  Check,
  X,
  Plus,
  Trash2,
} from "lucide-react";

/* ------------------------------------------------------------------
   DATOS DE EJEMPLO
   Reemplazar por las respuestas reales de:
   GET /api/auth/profile · GET /api/orders/my-orders · GET /api/codes/user
------------------------------------------------------------------- */

const mockUser = {
  fullName: "Santiago Delgado",
  nickname: "NightRunner_99",
  email: "santiago.delgado@correo.com",
  phone: "+57 315 402 7788",
  birthDate: "1999-04-12",
  billingAddress: "cufe-8842-af21@facturaelectronica.co",
  role: "user",
  avatarUrl: "",
  createdAt: "2024-02-18",
};

const mockOrders = [
  {
    id: "6710a9f2",
    code: "GTA6-PS5-2291",
    date: "2026-09-02T18:24:00",
    product: "Grand Theft Auto VI",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&h=200&fit=crop",
    price: 259900,
    quantity: 1,
  },
  {
    id: "670f22b1",
    code: "1200VB-XBOX-01",
    date: "2026-08-27T10:05:00",
    product: "1200 V-Bucks",
    image:
      "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=200&h=200&fit=crop",
    price: 49900,
    quantity: 2,
  },
  {
    id: "66e8c110",
    code: "GPU-PC-77410",
    date: "2026-07-14T21:47:00",
    product: "Game Pass Ultimate · 3 meses",
    image:
      "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=200&h=200&fit=crop",
    price: 89900,
    quantity: 1,
  },
];

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

const mockFavorites = [
  {
    id: "p_elden2",
    name: "Elden Ring: Nightreign",
    price: 219900,
    image:
      "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=300&h=300&fit=crop",
  },
  {
    id: "p_ff7",
    name: "Final Fantasy VII Rebirth",
    price: 189900,
    image:
      "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=300&fit=crop",
  },
];

const mockPaymentMethods = [
  { id: "pm_1", brand: "Visa", last4: "4412", holder: "SANTIAGO DELGADO" },
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
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-black">
      <div
        className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full opacity-40 blur-[120px]"
        style={{ backgroundColor: "#FF137A" }}
      />
      <div
        className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full opacity-40 blur-[120px]"
        style={{ backgroundColor: "#00FF37" }}
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]">
        <Gamepad2 size={640} strokeWidth={0.6} className="blur-[2px] text-white" />
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
      {Icon && <Icon size={16} />}
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

function ProfileHeader({ user }) {
  return (
    <GlassPanel className="relative overflow-hidden p-6 md:p-8">
      <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
        <div className="relative shrink-0">
          <div className="h-24 w-24 overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-[#FF137A]/30 to-[#00FF37]/30 shadow-[0_0_24px_-6px_#FF137A]">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Gamepad2 size={40} className="text-white/80" />
              </div>
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-black bg-[#00FF37] shadow-[0_0_10px_#00FF37]" />
        </div>

        <div className="flex-1">
          <h1 className="font-haze text-2xl tracking-wide text-white md:text-3xl">
            {user.fullName}
          </h1>
          {user.nickname && (
            <p className="mt-1 font-Urbanist text-sm text-white/50">
              @{user.nickname}
            </p>
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
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

        <PillButton icon={Pencil} variant="pink">
          Editar perfil
        </PillButton>
      </div>
    </GlassPanel>
  );
}

/* ------------------------------------------------------------------
   TAB: DATOS PERSONALES
------------------------------------------------------------------- */

function LockedField({ icon: Icon, label, value, type = "text" }) {
  const [locked, setLocked] = useState(true);
  const [draft, setDraft] = useState(value);

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 font-Urbanist text-xs text-white/50">
        <Icon size={14} />
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={draft}
          disabled={locked}
          onChange={(e) => setDraft(e.target.value)}
          className={`w-full rounded-full border px-4 py-2.5 font-Urbanist text-sm outline-none transition-colors ${
            locked
              ? "border-white/10 bg-black/30 text-white/50"
              : "border-[#00FF37]/40 bg-white/5 text-white shadow-[0_0_14px_-6px_#00FF37]"
          }`}
        />
        <button
          onClick={() => setLocked((v) => !v)}
          aria-label={locked ? `Editar ${label}` : `Bloquear ${label}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:scale-105"
        >
          {locked ? <Pencil size={15} /> : <Check size={15} className="text-[#7CFF9B]" />}
        </button>
      </div>
    </div>
  );
}

function PersonalDataTab({ user }) {
  return (
    <GlassPanel className="p-6 md:p-8">
      <SectionTitle>Datos personales</SectionTitle>
      <p className="mt-1 font-Urbanist text-sm text-white/50">
        Tu correo permanece bloqueado por seguridad; usa el lápiz para
        habilitar su edición.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <LockedField icon={Mail} label="Correo electrónico" value={user.email} type="email" />
        <LockedField icon={Phone} label="Número de teléfono" value={user.phone} type="tel" />
        <LockedField
          icon={Cake}
          label="Fecha de nacimiento"
          value={user.birthDate}
          type="date"
        />
        <LockedField
          icon={FileText}
          label="Dirección de facturación electrónica"
          value={user.billingAddress}
        />
      </div>

      <div className="mt-7 flex justify-end">
        <PillButton icon={Check} variant="green">
          Guardar cambios
        </PillButton>
      </div>
    </GlassPanel>
  );
}

/* ------------------------------------------------------------------
   TAB: HISTORIAL DE COMPRAS
------------------------------------------------------------------- */

function OrderCard({ order }) {
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
            <Hash size={13} /> {order.id.toUpperCase()}
          </span>
          <span>Cantidad: {order.quantity}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
        <p className="font-Urbanist text-lg text-white">
          {formatCOP(order.price)}
        </p>
        <PillButton icon={KeyRound} variant="pink">
          Solicitar código del juego
        </PillButton>
      </div>
    </div>
  );
}

function OrdersTab({ orders }) {
  return (
    <GlassPanel className="p-6 md:p-8">
      <SectionTitle>Historial de compras</SectionTitle>
      <p className="mt-1 font-Urbanist text-sm text-white/50">
        {orders.length} órdenes registradas en tu cuenta.
      </p>
      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </GlassPanel>
  );
}

/* ------------------------------------------------------------------
   TAB: FAVORITOS
------------------------------------------------------------------- */

function FavoritesTab({ favorites }) {
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

  return (
    <div className="relative min-h-screen">
      <GlowBackdrop />

      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-10 md:pt-16">
        <ProfileHeader user={mockUser} />

        <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
          <SideNav active={activeTab} onChange={setActiveTab} />

          <div>
            {activeTab === "perfil" && <PersonalDataTab user={mockUser} />}
            {activeTab === "compras" && <OrdersTab orders={mockOrders} />}
            {activeTab === "favoritos" && (
              <FavoritesTab favorites={mockFavorites} />
            )}
            {activeTab === "pagos" && (
              <PaymentMethodsTab methods={mockPaymentMethods} />
            )}
            {activeTab === "resenas" && <ReviewsTab reviews={mockReviews} />}
            {activeTab === "seguridad" && <SecurityTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
