import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Limpiar carrito
    localStorage.removeItem('cart');

    // Redirigir al perfil después de 3 segundos
    const timer = setTimeout(() => {
      navigate('/profile');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          
          {/* Icono de éxito animado */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg 
              className="w-12 h-12 text-green-600" 
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Pago Exitoso!
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Tu compra ha sido procesada correctamente
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              📧 Recibirás un email de confirmación con los códigos de tus juegos
            </p>
          </div>

          {/* Botón */}
          <button
            onClick={() => navigate('/profile')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold
              hover:bg-blue-700 transition-all duration-300 transform hover:scale-105
              shadow-lg hover:shadow-xl"
          >
            Ver mis productos
          </button>

          {/* Contador */}
          <p className="text-sm text-gray-500 mt-4">
            Redirigiendo automáticamente en 3 segundos...
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;