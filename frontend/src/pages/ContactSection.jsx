import { useState } from "react";
 
/**
 * ContactSection
 * Módulo de "Contáctanos" — fondo negro puro con manchas de luz neón difuminadas,
 * panel en glassmorphism, inputs con bordes translúcidos y botón pill con glow.
 *
 * Requiere en tu proyecto:
 * - Tailwind configurado con las utilidades por defecto (blur, backdrop-blur, mask, etc.)
 * - Fuentes registradas como `font-haze` (grafiti/urbano) y `font-Urbanist` (cuerpo)
 * - Opcional: un logo en /logo.svg para la marca de agua decorativa
 */
export default function ContactSection() {
  const [form, setForm] = useState({ nombre: "", correo: "", mensaje: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
 
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
 
      const data = await res.json().catch(() => null);
 
      if (!res.ok) {
        console.error("Fallo al enviar:", res.status, data);
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
 
      setStatus("sent");
      setForm({ nombre: "", correo: "", mensaje: "" });
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };
 
  return (
    <section className="relative flex h-screen w-full items-center overflow-hidden bg-black px-6 pt-28">
      {/* Manchas de luz neón en esquinas opuestas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full opacity-40 blur-[120px]"
        style={{ backgroundColor: "#FF137A" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full opacity-40 blur-[120px]"
        style={{ backgroundColor: "#00FF37" }}
      />
 
      {/* Logo como marca de agua ambiental */}
      <img
        src="/logo.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-10 top-10 w-40 opacity-10 blur-[2px] hidden md:block"
      />
 
      <div className="relative mx-auto grid w-full max-w-5xl grid-cols-1 place-items-center gap-12 md:grid-cols-2 md:items-center">
        {/* Columna de texto */}
        <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left">
          <span className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs text-white/70 backdrop-blur font-Urbanist">
            Hablemos
          </span>
 
          <h2 className="font-haze text-4xl uppercase leading-[1.05] text-white sm:text-5xl">
            Contáctanos
          </h2>
 
          <p className="max-w-sm font-Urbanist text-base leading-relaxed text-white/60">
            Cuéntanos qué necesitas. Te respondemos en menos de 24 horas
            hábiles.
          </p>
 
          <div className="mt-4 flex flex-col items-center gap-3 font-Urbanist text-sm text-white/60 md:items-start">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#FF137A" }} />
              hola@tudominio.com
            </div>
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#00FF37" }} />
              +57 300 000 0000
            </div>
          </div>
        </div>
 
        {/* Panel del formulario (vidrio esmerilado) */}
        <form
          onSubmit={handleSubmit}
          className="relative flex w-full max-w-md flex-col justify-center rounded-[20px] border border-white/20 bg-white/10 p-6 backdrop-blur-xl sm:aspect-square sm:p-10"
        >
          <div className="flex flex-col gap-4">
            <Field
              label="Nombre"
              name="nombre"
              type="text"
              placeholder="Tu nombre"
              value={form.nombre}
              onChange={handleChange}
            />
            <Field
              label="Correo electrónico"
              name="correo"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={form.correo}
              onChange={handleChange}
            />
            <div className="flex flex-col gap-2">
              <label
                htmlFor="mensaje"
                className="font-Urbanist text-xs text-white/50"
              >
                Mensaje
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                rows={3}
                required
                placeholder="Cuéntanos en qué podemos ayudarte"
                value={form.mensaje}
                onChange={handleChange}
                className="resize-none rounded-[20px] border border-white/20 bg-black/50 px-4 py-3 font-Urbanist text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/40"
              />
            </div>
 
            <button
              type="submit"
              disabled={status === "sending"}
              className="group relative mt-2 inline-flex w-fit items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-3 font-haze text-sm uppercase text-white backdrop-blur transition-colors hover:scale-105 hover:border-transparent disabled:opacity-60"
              style={{
                transition: "transform 200ms ease, background-color 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 24px 2px rgba(255,19,122,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {status === "sending"
                ? "Enviando..."
                : status === "sent"
                ? "Mensaje enviado"
                : "Enviar mensaje"}
            </button>
 
            {status === "sent" && (
              <p className="font-Urbanist text-xs text-white/50">
                Gracias, te contactaremos pronto.
              </p>
            )}
            {status === "error" && (
              <p className="font-Urbanist text-xs" style={{ color: "#FF137A" }}>
                Algo salió mal. Intenta de nuevo.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
 
function Field({ label, name, type, placeholder, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="font-Urbanist text-xs text-white/50">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="rounded-full border border-white/20 bg-black/50 px-4 py-3 font-Urbanist text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/40"
      />
    </div>
  );
}