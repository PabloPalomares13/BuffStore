import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
 
const link = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000/api';
 
const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [emailStatus, setEmailStatus] = useState('checking'); // checking | sent | error
 
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');
 
  useEffect(() => {
    // Limpiar carrito
    localStorage.removeItem('cart');
 
    // Fallback: en sandbox el webhook de merchant_order suele estar
    // bloqueado por Mercado Pago, así que verificamos el pago manualmente
    // usando el payment_id que MP puso en la URL de retorno. Si el
    // webhook ya lo procesó, este endpoint es idempotente y no hace nada raro.
    const verifyPayment = async () => {
      if (!paymentId) {
        setEmailStatus('error');
        return;
      }
 
      try {
        const token = localStorage.getItem('userToken');
        const res = await axios.post(
          `${link}/payments/verify/${paymentId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
 
        if (res.data.success && res.data.status === 'approved') {
          setEmailStatus('sent');
        } else {
          setEmailStatus('error');
        }
      } catch (err) {
        console.error('Error verificando el pago:', err);
        setEmailStatus('error');
      }
    };
 
    verifyPayment();
 
    // Redirigir al perfil después de 30 segundos
    const timer = setTimeout(() => {
      navigate('/userprofile');
    }, 30000);
 
    return () => clearTimeout(timer);
  }, [navigate, paymentId]);
 
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">

      {/* Ambiente dominante verde neón (~50% de la pantalla) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00FF37]/40 via-[#00FF37]/10 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-[#00FF37] opacity-60 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] rounded-full bg-[#00FF37] opacity-40 blur-[120px] pointer-events-none" />


      {/* Logo decorativo como marca de agua (opcional, ajusta el src) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 blur-sm pointer-events-none">
        {/* <img src="/logo.svg" alt="" className="w-96 h-96 object-contain" /> */}
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[20px] shadow-2xl p-8 text-center">

          {/* Icono de éxito animado */}
          <div className="w-24 h-24 bg-[#00FF37]/10 border border-[#00FF37]/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-[0_0_25px_rgba(0,255,55,0.5)]">
            <svg
              className="w-12 h-12 text-[#00FF37]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Mensaje principal */}
          <h1 className="font-haze uppercase text-3xl text-white mb-2 tracking-wide">
            ¡Pago Exitoso!
          </h1>

          <p className="font-Urbanist text-lg text-white/60 mb-6">
            Tu compra ha sido procesada correctamente
          </p>

          {/* Detalles */}
          <div className="bg-black/50 backdrop-blur-md border border-white/20 rounded-[20px] p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="font-Urbanist text-white/50">ID de pago:</span>
              <span className="font-Urbanist font-semibold text-white">
                #{paymentId?.slice(-8) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-Urbanist text-white/50">Orden:</span>
              <span className="font-Urbanist font-semibold text-white">
                #{externalReference?.slice(-8) || 'N/A'}
              </span>
            </div>
          </div>

          {/* Información adicional (según el estado real de la verificación) */}
          {emailStatus === 'checking' && (
            <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-[20px] p-4 mb-6">
              <p className="font-Urbanist text-sm text-white/60">
                Confirmando tu pago...
              </p>
            </div>
          )}
          {emailStatus === 'sent' && (
            <div className="bg-[#00FF37]/10 backdrop-blur-md border border-[#00FF37]/30 rounded-[20px] p-4 mb-6">
              <p className="font-Urbanist text-sm text-[#00FF37]">
                📧 Recibirás un email de confirmación con los códigos de tus juegos
              </p>
            </div>
          )}
          {emailStatus === 'error' && (
            <div className="bg-[#FF137A]/10 backdrop-blur-md border border-[#FF137A]/30 rounded-[20px] p-4 mb-6">
              <p className="font-Urbanist text-sm text-[#FF137A]">
                No pudimos confirmar tu pago automáticamente. Revisa tu perfil en unos minutos o contáctanos si no ves tus códigos.
              </p>
            </div>
          )}

          {/* Botón */}
          <button
            onClick={() => navigate('/profile')}
            className="font-haze uppercase w-full bg-[#00FF37]/10 border border-[#00FF37]/40 text-white py-3 px-6 rounded-full
              hover:bg-[#00FF37]/20 hover:scale-105 transition-colors transition-transform duration-300
              shadow-[0_0_20px_rgba(0,255,55,0.35)] hover:shadow-[0_0_30px_rgba(0,255,55,0.55)]"
          >
            Ver mis productos
          </button>

          {/* Contador */}
          <p className="font-Urbanist text-sm text-white/40 mt-4">
            Redirigiendo automáticamente en unos segundos...
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;