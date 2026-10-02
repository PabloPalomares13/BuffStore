import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import DashboardCard from "../components/ui/DashboardCard";

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

const formatDate = (d, withTime = false) =>
  new Date(d).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime && { hour: "2-digit", minute: "2-digit" }),
  });

const glass =
  "bg-white/10 backdrop-blur-md border border-white/20 transition-colors hover:bg-white/20";

// ---------- Descripción de cada acción (para el modal) ----------
const buildAction = (user, type) => {
  const name = user.fullName || user.email;
  switch (type) {
    case "makeAdmin":
      return {
        title: "Dar rol de administrador",
        text: `${name} podrá ver las analíticas, gestionar productos, órdenes y otros usuarios.`,
        confirm: "Hacer admin",
        color: GREEN,
        request: () =>
          axios.patch(`${link}/api/admin/users/${user._id}/role`, { role: "admin" }, authHeaders()),
      };
    case "removeAdmin":
      return {
        title: "Quitar rol de administrador",
        text: `${name} volverá a ser un usuario normal y perderá el acceso al panel.`,
        confirm: "Quitar admin",
        color: PINK,
        request: () =>
          axios.patch(`${link}/api/admin/users/${user._id}/role`, { role: "user" }, authHeaders()),
      };
    case "block":
      return {
        title: "Bloquear usuario",
        text: `${name} no podrá usar su cuenta hasta que lo desbloquees.`,
        confirm: "Bloquear",
        color: PINK,
        request: () =>
          axios.patch(`${link}/api/admin/users/${user._id}/block`, { blocked: true }, authHeaders()),
      };
    default:
      return {
        title: "Desbloquear usuario",
        text: `${name} podrá volver a usar su cuenta.`,
        confirm: "Desbloquear",
        color: GREEN,
        request: () =>
          axios.patch(`${link}/api/admin/users/${user._id}/block`, { blocked: false }, authHeaders()),
      };
  }
};

const auditText = (l) => {
  if (l.action === "role_change")
    return `${l.actorEmail} cambió el rol de ${l.targetEmail}: ${l.from} → ${l.to}`;
  if (l.action === "block") return `${l.actorEmail} bloqueó a ${l.targetEmail}`;
  return `${l.actorEmail} desbloqueó a ${l.targetEmail}`;
};

// ---------- Modal de confirmación ----------
const ConfirmModal = ({ action, busy, onCancel, onConfirm }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    role="dialog"
    aria-modal="true"
  >
    <div className="w-full max-w-md rounded-[20px] border border-white/20 bg-black/80 backdrop-blur-md p-6">
      <h3 className="font-haze text-xl uppercase text-white">{action.title}</h3>
      <p className="font-Urbanist text-white/70 mt-3">{action.text}</p>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onCancel}
          disabled={busy}
          className={`font-Urbanist rounded-full px-5 py-2 text-white ${glass}`}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="font-haze uppercase rounded-full px-5 py-2 text-white bg-white/10 border border-white/20 transition-all hover:scale-105 disabled:opacity-50"
          style={{ boxShadow: `0 0 16px ${action.color}88` }}
        >
          {busy ? "Guardando..." : action.confirm}
        </button>
      </div>
    </div>
  </div>
);

const Usuarios = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState(""); // valor con debounce
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [pending, setPending] = useState(null); // { user, type }
  const [busy, setBusy] = useState(false);

  const [logs, setLogs] = useState([]);

  // Debounce del buscador
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${link}/api/admin/users`, {
        ...authHeaders(),
        params: { search, role, status, page, limit: LIMIT },
      });
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [search, role, status, page]);

  const loadAudit = useCallback(async () => {
    try {
      const { data } = await axios.get(`${link}/api/admin/audit`, {
        ...authHeaders(),
        params: { limit: 8 },
      });
      setLogs(data.logs);
    } catch {
      /* el historial es secundario: si falla no bloquea la página */
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  const confirmAction = async () => {
    const action = buildAction(pending.user, pending.type);
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const { data } = await action.request();
      setNotice(data.message);
      setPending(null);
      await Promise.all([loadUsers(), loadAudit()]);
    } catch (err) {
      setPending(null);
      setError(err.response?.data?.message || "No se pudo completar la acción.");
    } finally {
      setBusy(false);
    }
  };

  const changeFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const selectCls =
    "font-Urbanist rounded-full px-4 py-2 text-white bg-white/10 border border-white/20 backdrop-blur-md focus:outline-none focus:border-white/50 [&>option]:bg-black";

  return (
    <div className="relative bg-[#232323]/40 backdrop-blur-md rounded-[20px] shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] shadow-[#000000]/70 p-6 overflow-hidden"
      style={{ fontFamily: '"Urbanist", sans-serif' }}>
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div>
            <h1 className="font-haze text-3xl sm:text-4xl uppercase text-white mb-2">Usuarios</h1>
            <p className="font-Urbanist text-white/60">
              {total} {total === 1 ? "usuario" : "usuarios"} en total con estos filtros
            </p>
          </div>
          <Link to="/Dashboard" className={`font-Urbanist rounded-full px-5 py-2 text-white ${glass}`}>
            Volver al panel
          </Link>
        </div>

        {/* Mensajes */}
        {error && (
          <div
            className="rounded-[20px] border border-white/20 bg-white/10 p-4 font-Urbanist"
            style={{ color: PINK }}
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            className="rounded-[20px] border border-white/20 bg-white/10 p-4 font-Urbanist"
            style={{ color: GREEN }}
          >
            {notice}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, email o ID"
            className="flex-1 min-w-[220px] font-Urbanist rounded-full px-5 py-2 text-white placeholder-white/40 bg-white/10 border border-white/20 backdrop-blur-md focus:outline-none focus:border-white/50"
          />
          <select value={role} onChange={changeFilter(setRole)} className={selectCls}>
            <option value="">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="user">Usuarios</option>
          </select>
          <select value={status} onChange={changeFilter(setStatus)} className={selectCls}>
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="blocked">Bloqueados</option>
          </select>
        </div>

        {/* Tabla */}
        <DashboardCard>
          {loading ? (
            <div className="h-64 rounded-[14px] bg-white/5 animate-pulse " />
          ) : users.length === 0 ? (
            <p className="py-10 text-center text-white/40">
              No encontramos usuarios con esos filtros. Prueba con otro nombre o email.
            </p>
          ) : (
            <div className="overflow-x-auto ">
              <table className="w-full text-left font-Urbanist text-sm">
                <thead>
                  <tr className="text-white/50 border-b border-white/10">
                    <th className="py-2 pr-4 font-medium">Usuario</th>
                    <th className="py-2 pr-4 font-medium">Rol</th>
                    <th className="py-2 pr-4 font-medium">Estado</th>
                    <th className="py-2 pr-4 font-medium">Registro</th>
                    <th className="py-2 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover border border-white/20"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70">
                              {(u.fullName || u.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-white truncate">
                              {u.fullName || u.nickname || "Sin nombre"}
                              {u.isSelf && <span className="text-white/40"> (tú)</span>}
                            </p>
                            <p className="text-white/40 text-xs truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="inline-block rounded-full border border-white/20 bg-white/5 px-3 py-0.5 text-xs"
                          style={{ color: u.role === "admin" ? GREEN : "rgba(255,255,255,0.7)" }}
                        >
                          {u.role === "admin" ? "Admin" : "Usuario"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="inline-block rounded-full border border-white/20 bg-white/5 px-3 py-0.5 text-xs"
                          style={{ color: u.isBlocked ? PINK : "rgba(255,255,255,0.7)" }}
                        >
                          {u.isBlocked ? "Bloqueado" : "Activo"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-white/60 whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          {u.isSelf ? (
                            <span className="text-white/30 text-xs py-1.5">Sin acciones sobre tu cuenta</span>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  setPending({ user: u, type: u.role === "admin" ? "removeAdmin" : "makeAdmin" })
                                }
                                className={`rounded-full px-3 py-1.5 text-xs text-white ${glass}`}
                              >
                                {u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                              </button>
                              {/* Un admin no se bloquea directamente: primero hay que quitarle el rol */}
                              {(u.role !== "admin" || u.isBlocked) && (
                                <button
                                  onClick={() =>
                                    setPending({ user: u, type: u.isBlocked ? "unblock" : "block" })
                                  }
                                  className={`rounded-full px-3 py-1.5 text-xs text-white ${glass}`}
                                >
                                  {u.isBlocked ? "Desbloquear" : "Bloquear"}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4 font-Urbanist text-sm">
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
        </DashboardCard>

        {/* Historial de auditoría */}
        <DashboardCard title="Historial de cambios">
          {logs.length === 0 ? (
            <p className="py-6 text-center text-white/40">
              Todavía no hay cambios de rol ni bloqueos registrados.
            </p>
          ) : (
            <ul className="divide-y divide-white/5 font-Urbanist text-sm">
              {logs.map((l, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="text-white/80">{auditText(l)}</span>
                  <span className="text-white/40 text-xs whitespace-nowrap">
                    {formatDate(l.createdAt, true)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>

      {pending && (
        <ConfirmModal
          action={buildAction(pending.user, pending.type)}
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={confirmAction}
        />
      )}
    </div>
  );
};

export default Usuarios;