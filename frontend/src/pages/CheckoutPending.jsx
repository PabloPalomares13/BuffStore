import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const link = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000/api';

const CheckoutPending = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  // Registra el estado pendiente incluso cuando el webhook de pruebas no
  // logra llegar al túnel local.
  useEffect(() => {
    const verifyPendingPayment = async () => {
      if (!paymentId) return;

      try {
        const token = localStorage.getItem('userToken');
        const response = await axios.post(
          `${link}/payments/verify/${paymentId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.info('Resultado del pago pendiente:', response.data);
      } catch (error) {
        console.error('No se pudo consultar el pago pendiente:', error.response?.data || error.message);
      }
    };

    verifyPendingPayment();
  }, [paymentId]);

    return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden py-28 ">

      {/* Ambiente indeciso: neblina blanca central + neones en equilibrio a los lados */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white opacity-[0.08] blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-[#00FF37] opacity-20 blur-[120px] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-[#FF137A] opacity-20 blur-[120px] pointer-events-none" />

      {/* Logo decorativo como marca de agua (opcional, ajusta el src) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 blur-sm pointer-events-none">
        {/* <img src="/logo.svg" alt="" className="w-96 h-96 object-contain" /> */}
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[20px] shadow-2xl p-8 text-center">
          
          {/* Icono de espera */}
          <div className="w-24 h-24 bg-white/10 border border-white/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(255,255,255,0.25)]">
            <svg 
              className="w-12 h-12 text-white animate-spin" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>

          {/* Mensaje principal */}
          <h1 className="font-haze uppercase text-3xl text-white mb-2 tracking-wide">
            Pago Pendiente
          </h1>
          
          <p className="font-Urbanist text-lg text-white/60 mb-6">
            Tu pago está en proceso de verificación
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

          {/* Información adicional */}
          <div className="bg-white/5 backdrop-blur-md border border-white/20 rounded-[20px] p-4 mb-6">
            <p className="font-Urbanist text-sm text-white/80 mb-2">
              ⏳ Estamos procesando tu pago
            </p>
            <p className="font-Urbanist text-xs text-white/50">
              Esto puede tardar desde unos minutos hasta 2 días hábiles dependiendo del método de pago.
              Te notificaremos por email cuando sea aprobado.
            </p>
          </div>

          {/* Métodos pendientes comunes */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[20px] p-4 mb-6 text-left">
            <p className="font-Urbanist text-xs font-semibold text-white/70 mb-2">
              Métodos que requieren aprobación:
            </p>
            <ul className="font-Urbanist text-xs text-white/40 space-y-1">
              <li>• Transferencias bancarias (PSE)</li>
              <li>• Pagos en efectivo (Efecty, Baloto)</li>
              <li>• Algunos bancos internacionales</li>
            </ul>
          </div>

          {/* Botones */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/profile')}
              className="font-haze uppercase w-full bg-white/10 border border-white/40 text-white py-3 px-6 rounded-full
                hover:bg-white/20 hover:scale-105 transition-colors transition-transform duration-300
                shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.35)]"
            >
              Ver mis órdenes
            </button>
            
            <button
              onClick={() => navigate('/home')}
              className="font-haze uppercase w-full bg-white/10 backdrop-blur-md border border-white/20 text-white py-3 px-6 rounded-full
                hover:bg-white/20 hover:scale-105 transition-colors transition-transform duration-300"
            >
              Volver al inicio
            </button>
          </div>

          {/* Nota */}
          <p className="font-Urbanist text-xs text-white/40 mt-6">
            💡 No necesitas hacer nada más. Te notificaremos cuando el pago sea confirmado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPending;