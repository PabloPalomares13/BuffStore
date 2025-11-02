import { useEffect, useState } from "react";
import axios from "axios";
import { User, Mail, Calendar, ShoppingBag, KeyRound, CheckCircle, XCircle } from "lucide-react";

const link = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : "http://localhost:3000";

export default function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState([]); // ✅ códigos comprados
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("userToken");
      try {
        const [userRes, ordersRes, codesRes] = await Promise.all([
          axios.get(`${link}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${link}/api/orders/my-orders`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${link}/api/codes/user`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setUserData(userRes.data);
        setOrders(ordersRes.data);
        setCodes(codesRes.data);
      } catch (error) {
        console.error("Error al cargar datos del perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);
  const verifyCode = async (code) => {
    setVerifying(true);
    try {
      const res = await axios.get(`${link}/api/codes/verify/${code}`);
      setVerifyResult({
        code: res.data.code,
        status: res.data.status,
        product: res.data.product,
      });
    } catch (error) {
      setVerifyResult({
        code,
        status: "inexistente",
      });
    } finally {
      setVerifying(false);
      setTimeout(() => setVerifyResult(null), 5000);
    }
  };
  if (loading) return <div className="p-8 text-center pt-28 h-screen    ">Cargando...</div>;

  if (!userData)
    return (
      <div className="p-8 text-center text-red-600 pt-28 h-screen">
        Error: No se pudo cargar el perfil del usuario.
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto h-auto pt-28 pb-20">
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200 p-8">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <User className="text-purple-600" /> Perfil del Usuario
        </h1>

        {/* Datos del usuario */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="space-y-3">
            <p className="text-gray-700">
              <span className="font-semibold text-gray-900">Correo:</span>{" "}
              <Mail className="inline w-4 h-4 text-gray-500 mr-1" />
              {userData.email}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold text-gray-900">ID Personal:</span>{" "}
              {userData.personalID || "No registrado"}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold text-gray-900">Tipo de ID:</span>{" "}
              {userData.typeID || "No registrado"}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-gray-700">
              <span className="font-semibold text-gray-900">Rol:</span>{" "}
              <span
                className={`${
                  userData.role === "admin"
                    ? "text-red-600 font-semibold"
                    : "text-green-600 font-semibold"
                }`}
              >
                {userData.role.toUpperCase()}
              </span>
            </p>
            <p className="text-gray-700 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-500" />
              Miembro desde:{" "}
              {new Date(userData.createdAt).toLocaleDateString("es-CO")}
            </p>
          </div>
        </div>

        {/* Historial de órdenes */}
        <div className="border-t border-gray-300 my-6"></div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ShoppingBag className="text-blue-600" /> Historial de Órdenes
        </h2>

        {orders.length === 0 ? (
          <p className="text-gray-600">Aún no tienes órdenes registradas.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="border border-gray-200 rounded-xl p-4 bg-white/60 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-900">
                    Orden #{order._id.slice(-6).toUpperCase()}
                  </p>
                  <span className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleString("es-CO")}
                  </span>
                </div>
                <p className="text-gray-700 mt-2">
                  <span className="font-medium">Total:</span> $
                  {order.totals.total}
                </p>
                <ul className="list-disc ml-5 mt-3 text-gray-600">
                  {order.products.map((p, i) => (
                    <li key={i}>
                      {p.name} × {p.quantity} — ${p.price}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Códigos del usuario */}
        <div className="border-t border-gray-300 my-6"></div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <KeyRound className="text-indigo-600" /> Mis Códigos
        </h2>

        {codes.length === 0 ? (
          <p className="text-gray-600">
            Aún no tienes códigos asignados a tus compras.
          </p>
        ) : (
          <div className="space-y-3">
            {codes.map((codeObj) => (
              <div
                key={codeObj._id}
                className="flex flex-col md:flex-row justify-between items-center border border-gray-200 rounded-xl p-4 bg-white/60 shadow-sm hover:shadow-md transition"
              >
                <div>
                  <p className="text-gray-800 font-medium">
                    {codeObj.product?.name || "Producto desconocido"}
                  </p>
                  <p className="text-gray-600 text-sm">Código: {codeObj.code}</p>
                  <p
                    className={`text-sm font-semibold mt-1 ${
                      codeObj.status === "valid"
                        ? "text-green-600"
                        : codeObj.status === "used"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    Estado: {codeObj.status}
                  </p>
                </div>
                <button
                  onClick={() => verifyCode(codeObj.code)}
                  disabled={verifying}
                  className="mt-3 md:mt-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-60"
                >
                  Verificar código
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Resultado de verificación */}
        {verifyResult && (
          <div
            className={`mt-6 p-4 rounded-xl ${
              verifyResult.status === "valid"
                ? "bg-green-100 text-green-700"
                : verifyResult.status === "used"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {verifyResult.status === "valid" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>
                Código {verifyResult.code}:{" "}
                {verifyResult.status === "valid"
                  ? "Válido"
                  : verifyResult.status === "used"
                  ? "Ya fue usado"
                  : "No existe o expirado"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
