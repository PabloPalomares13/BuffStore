// frontend/src/components/MercadoPagoCheckout.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000/api'
const MercadoPagoCheckout = ({ orderId, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preferenceId, setPreferenceId] = useState(null);

  // Cargar el SDK de Mercado Pago
  useEffect(() => {
    const loadMercadoPagoSDK = () => {
      // Verificar si ya está cargado
      if (window.MercadoPago) {
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => {
        console.log('✅ Mercado Pago SDK cargado');
      };
      script.onerror = () => {
        console.error('❌ Error al cargar Mercado Pago SDK');
        setError('Error al cargar el sistema de pagos');
      };
      document.body.appendChild(script);
    };

    loadMercadoPagoSDK();
  }, []);

  // Crear preferencia de pago
  const createPaymentPreference = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('userToken'); // Tu JWT
      console.log('🔑 Token completo:', token);
    console.log('📏 Token length:', token?.length);
      const response = await axios.post(
        `${link}/payments/create-preference`,
        { orderId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const { preferenceId, sandboxInitPoint } = response.data.data;
        setPreferenceId(preferenceId);
        
        // Inicializar Mercado Pago
        initMercadoPago(preferenceId, sandboxInitPoint);
      }

    } catch (err) {
      console.error('Error al crear preferencia:', err);
      console.error('Respuesta del servidor:', err.response?.data);
      setError(err.response?.data?.message || 'Error al procesar el pago');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  // Inicializar el checkout de Mercado Pago
  const initMercadoPago = (prefId, sandboxUrl) => {
    const mp = new window.MercadoPago(
      import.meta.env.VITE_MP_PUBLIC_KEY, 
      {locale: 'es-CO'});

    /* Opción 1: Checkout Pro (modal)
    mp.checkout({
      preference: {
        id: prefId
      },
      autoOpen: true, // Abre automáticamente
    });

    // Opción 2: Redirigir a Mercado Pago (más simple para sandbox)
  */ window.open(sandboxUrl, '_blank'); 
  };

  // Verificar estado del pago (llamar después de que el usuario vuelva)
  const checkPaymentStatus = async (paymentId) => {
    try {
      const token = localStorage.getItem('userToken');
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/payments/${paymentId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const payment = response.data.data;
        
        if (payment.status === 'approved') {
          if (onSuccess) onSuccess(payment);
        }
        
        return payment;
      }
    } catch (err) {
      console.error('Error al verificar pago:', err);
    }
  };

  return (
    <div className="mercadopago-checkout">
      {/* Botón para iniciar el pago */}
      <button
        onClick={createPaymentPreference}
        disabled={loading}
        className={`
          w-full py-4 px-6 rounded-lg font-semibold text-white text-lg
          transition-all duration-300 transform hover:scale-105
          ${loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
          }
        `}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <svg 
              className="animate-spin h-5 w-5 text-white" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Procesando...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" 
              />
            </svg>
            Pagar con Mercado Pago
          </div>
        )}
      </button>

      {/* Mensaje de error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <svg 
              className="w-5 h-5" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Logo de Mercado Pago */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
        <span>Pago seguro procesado por</span>
        <img 
          src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/5.21.22/mercadolibre/logo__large_plus.png" 
          alt="Mercado Pago" 
          className="h-6"
        />
      </div>

      {/* Métodos de pago aceptados */}
      <div className="mt-4 text-center text-xs text-gray-500">
        <p>Aceptamos tarjetas de crédito, débito, PSE y más</p>
      </div>
    </div>
  );
};

export default MercadoPagoCheckout;