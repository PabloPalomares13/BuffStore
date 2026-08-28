import { useNavigate, useSearchParams } from 'react-router-dom';

const CheckoutFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const paymentId = searchParams.get('payment_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          
          {/* Icono de error */}
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg 
              className="w-12 h-12 text-red-600" 
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pago Rechazado
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            No pudimos procesar tu pago
          </p>

          {/* Razones posibles */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Posibles razones:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Fondos insuficientes</li>
              <li>• Datos de tarjeta incorrectos</li>
              <li>• Límite de compra excedido</li>
              <li>• Tarjeta bloqueada o vencida</li>
            </ul>
          </div>

          {/* Detalles */}
          {paymentId && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-red-800">
                ID de transacción: #{paymentId.slice(-8)}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold
                hover:bg-blue-700 transition-all duration-300 transform hover:scale-105
                shadow-lg hover:shadow-xl"
            >
              Intentar de nuevo
            </button>
            
            <button
              onClick={() => navigate('/home')}
              className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg
                font-semibold hover:bg-gray-50 transition-all duration-300"
            >
              Volver al inicio
            </button>
          </div>

          {/* Ayuda */}
          <p className="text-sm text-gray-500 mt-6">
            ¿Necesitas ayuda? <a href="/support" className="text-blue-600 hover:underline">Contacta soporte</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFailure;