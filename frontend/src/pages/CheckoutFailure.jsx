import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const link = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000/api';

const CheckoutFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const paymentId = searchParams.get('payment_id');

  // El webhook puede no estar disponible durante pruebas locales. Consultamos
  // explícitamente el pago rechazado para que el servidor guarde y muestre
  // status_detail en su terminal.
  useEffect(() => {
    const verifyRejectedPayment = async () => {
      if (!paymentId) return;

      try {
        const token = localStorage.getItem('userToken');
        const response = await axios.post(
          `${link}/payments/verify/${paymentId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.info('Resultado del pago rechazado:', response.data);
      } catch (error) {
        console.error('No se pudo consultar el pago rechazado:', error.response?.data || error.message);
      }
    };

    verifyRejectedPayment();
  }, [paymentId]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">

      {/* Ambiente dominante rosa neón (~50% de la pantalla) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF137A]/40 via-[#FF137A]/10 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[#FF137A] opacity-60 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-[#FF137A] opacity-40 blur-[120px] pointer-events-none" />

      {/* Logo decorativo como marca de agua (opcional, ajusta el src) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 blur-sm pointer-events-none">
        {/* <img src="/logo.svg" alt="" className="w-96 h-96 object-contain" /> */}
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[20px] shadow-2xl p-8 text-center">
          
          {/* Icono de error */}
          <div className="w-24 h-24 bg-[#FF137A]/10 border border-[#FF137A]/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(255,19,122,0.5)]">
            <svg 
              className="w-12 h-12 text-[#FF137A]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </div>

          {/* Mensaje principal */}
          <h1 className="font-haze uppercase text-3xl text-white mb-2 tracking-wide">
            Pago Rechazado
          </h1>
          
          <p className="font-Urbanist text-lg text-white/60 mb-6">
            No pudimos procesar tu pago
          </p>

          {/* Razones posibles */}
          <div className="bg-black/50 backdrop-blur-md border border-white/20 rounded-[20px] p-4 mb-6 text-left">
            <p className="font-Urbanist text-sm font-semibold text-white/80 mb-2">
              Posibles razones:
            </p>
            <ul className="font-Urbanist text-sm text-white/50 space-y-1">
              <li>• Fondos insuficientes</li>
              <li>• Datos de tarjeta incorrectos</li>
              <li>• Límite de compra excedido</li>
              <li>• Tarjeta bloqueada o vencida</li>
            </ul>
          </div>

          {/* Detalles */}
          {paymentId && (
            <div className="bg-[#FF137A]/10 backdrop-blur-md border border-[#FF137A]/30 rounded-[20px] p-3 mb-6">
              <p className="font-Urbanist text-xs text-[#FF137A]">
                ID de transacción: #{paymentId.slice(-8)}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/checkout')}
              className="font-haze uppercase w-full bg-[#FF137A]/10 border border-[#FF137A]/40 text-white py-3 px-6 rounded-full
                hover:bg-[#FF137A]/20 hover:scale-105 transition-colors transition-transform duration-300
                shadow-[0_0_20px_rgba(255,19,122,0.35)] hover:shadow-[0_0_30px_rgba(255,19,122,0.55)]"
            >
              Intentar de nuevo
            </button>
            
            <button
              onClick={() => navigate('/home')}
              className="font-haze uppercase w-full bg-white/10 backdrop-blur-md border border-white/20 text-white py-3 px-6 rounded-full
                hover:bg-white/20 hover:scale-105 transition-colors transition-transform duration-300"
            >
              Volver al inicio
            </button>
          </div>

          {/* Ayuda */}
          <p className="font-Urbanist text-sm text-white/40 mt-6">
            ¿Necesitas ayuda? <a href="/support" className="text-[#00FF37] hover:underline">Contacta soporte</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFailure;
