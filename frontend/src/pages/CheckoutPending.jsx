import { useNavigate, useSearchParams } from 'react-router-dom';

const CheckoutPending = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          
          {/* Icono de espera */}
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg 
              className="w-12 h-12 text-yellow-600 animate-spin" 
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pago Pendiente
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Tu pago está en proceso de verificación
          </p>

          {/* Detalles */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">ID de pago:</span>
              <span className="font-semibold text-gray-900">
                #{paymentId?.slice(-8) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Orden:</span>
              <span className="font-semibold text-gray-900">
                #{externalReference?.slice(-8) || 'N/A'}
              </span>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 mb-2">
              ⏳ Estamos procesando tu pago
            </p>
            <p className="text-xs text-yellow-700">
              Esto puede tardar desde unos minutos hasta 2 días hábiles dependiendo del método de pago.
              Te notificaremos por email cuando sea aprobado.
            </p>
          </div>

          {/* Métodos pendientes comunes */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-blue-800 mb-2">
              Métodos que requieren aprobación:
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Transferencias bancarias (PSE)</li>
              <li>• Pagos en efectivo (Efecty, Baloto)</li>
              <li>• Algunos bancos internacionales</li>
            </ul>
          </div>

          {/* Botones */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/profile')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold
                hover:bg-blue-700 transition-all duration-300 transform hover:scale-105
                shadow-lg hover:shadow-xl"
            >
              Ver mis órdenes
            </button>
            
            <button
              onClick={() => navigate('/home')}
              className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg
                font-semibold hover:bg-gray-50 transition-all duration-300"
            >
              Volver al inicio
            </button>
          </div>

          {/* Nota */}
          <p className="text-xs text-gray-500 mt-6">
            💡 No necesitas hacer nada más. Te notificaremos cuando el pago sea confirmado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPending;