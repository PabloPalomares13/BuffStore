import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MercadoPagoCheckout from '../components/MercadoPagoCheckout';
import { useNavigate, useSearchParams } from 'react-router-dom';

const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'
const Checkout = () => {
  // Estados para carrito y datos de formulario
  const [order, setOrder] = useState(null);
  const [cart, setCart] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Estados para formulario
  const [formData, setFormData] = useState({
    // Datos personales
    fullName: '',
    email: '',
    phone: '',

    // Dirección de envío
    address: '',
    city: '',
    state: '',
    zipCode: '',

    // Datos de pago
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: ''
  });

  // Cargar datos del carrito desde localStorage
  useEffect(() => {
  const loadCartData = async () => {
    try {
      const savedCart = JSON.parse(localStorage.getItem('cart')) || [];

      // Si hay productos en el carrito, obtener detalles actualizados de cada uno
      if (savedCart.length > 0) {
        const updatedCart = await Promise.all(
          savedCart.map(async (item) => {
            try {
              // Obtener información actualizada del producto (stock, precio, etc.)
              const response = await axios.get(`${link}/api/products/${item._id}`);
              
              // Determinar la URL de la imagen según el formato
              let displayImageUrl = null;
              
              if (response.data.images && Array.isArray(response.data.images) && response.data.images.length > 0) {
                if (typeof response.data.images[0] === 'string') {
                  // Nuevo formato: URL directa de Google Cloud Storage
                  displayImageUrl = response.data.images[0];
                  console.log('Cart item using GCS URL:', displayImageUrl);
                } else if (response.data.images[0] && response.data.images[0].data) {
                  // Formato antiguo: imagen binaria en MongoDB
                  displayImageUrl = `${link}/api/products/image/${response.data._id}/0`;
                  console.log('Cart item using binary format URL:', displayImageUrl);
                }
              }
              
              return {
                _id: response.data._id,
                name: response.data.name,
                price: response.data.price,
                stock: response.data.stock,
                taxRate: response.data.taxRate,
                quantity: item.quantity || 1,
                displayImageUrl // URL actualizada según el formato
              };
            } catch (err) {
              console.error(`Error al obtener detalles del producto ${item._id}:`, err);
              // En caso de error, devolvemos un objeto básico con la información que tenemos
              return { 
                _id: item._id, 
                name: 'Producto no encontrado', 
                price: 0, 
                quantity: item.quantity || 0,
                displayImageUrl: null 
              };
            }
          })
        );

        setCart(updatedCart);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error al cargar el carrito:", err);
      setLoading(false);
    }
  };

  loadCartData();
}, []); 

  // Calcular totales cuando cambia el carrito
  useEffect(() => {
    const newSubtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newTaxes = cart.reduce((acc, item) => {
      const taxRate = (item.taxRate * 0.01) || 0.08; // 8% por defecto si no hay taxRate
      return acc + (item.price * item.quantity * taxRate);
    }, 0);

    setSubtotal(newSubtotal);
    setTaxes(newTaxes);
    setTotal(newSubtotal + newTaxes);
  }, [cart]);

  useEffect(() => {
  // Verificar si viene de una redirección de Mercado Pago
  const paymentStatus = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');
  const orderId = searchParams.get('external_reference');

  if (paymentStatus && paymentId) {
    handlePaymentReturn(paymentStatus, paymentId, orderId);
  }
}, [searchParams]);

// ⬇️ AGREGAR ESTA FUNCIÓN
const handlePaymentReturn = async (status, paymentId, orderId) => {
  if (status === 'approved') {
    localStorage.removeItem('cart');
    setAlert({
      show: true,
      type: 'success',
      message: '✅ ¡Pago aprobado! Tus productos digitales están disponibles.'
    });
    setStep(3);
    
    setTimeout(() => {
      navigate('/Userprofile');
    }, 3000);
    
  } else if (status === 'pending') {
    setAlert({
      show: true,
      type: 'warning',
      message: '⏳ Tu pago está pendiente de confirmación.'
    });
    
  } else {
    setAlert({
      show: true,
      type: 'error',
      message: '❌ El pago fue rechazado. Intenta con otro método.'
    });
    setStep(2);
  }
};

  // Manejar cambios en el formulario (sin cambios aquí)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Formato tarjeta (agrupación cada 4 dígitos)
    if (name === 'cardNumber') {
      const cleanValue = value.replace(/\D/g, '').slice(0, 16);
      formattedValue = cleanValue.match(/.{1,4}/g)?.join(' ') || '';
    }

    // Formato fecha (MM/YY) sin restricción de mes
    if (name === 'expiryDate') {
      const cleanValue = value.replace(/\D/g, '').slice(0, 4);
      if (cleanValue.length < 3) {
        formattedValue = cleanValue;
      } else {
        formattedValue = `${cleanValue.slice(0, 2)}/${cleanValue.slice(2)}`    ;
      }
    }

    // Formato CVC (máximo 3 números)
    if (name === 'cvc') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  // Incrementar cantidad
  const incrementQuantity = (productId) => {
    const updatedCart = cart.map(item => {
      if (item._id === productId) {
        // Verificar stock antes de incrementar
        if (item.quantity < item.stock) {
          return { ...item, quantity: item.quantity + 1 };
        }
      }
      return item;
    });

    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart.map(item => ({ _id: item._id, quantity: item.quantity }))));
  };

  // Decrementar cantidad
  const decrementQuantity = (productId) => {
    const updatedCart = cart.map(item => {
      if (item._id === productId && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    });

    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart.map(item => ({ _id: item._id, quantity: item.quantity }))));
  };

  // Eliminar producto
  const removeProduct = (productId) => {
    const updatedCart = cart.filter(item => item._id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart.map(item => ({ _id: item._id, quantity: item.quantity }))));
  };

  // Procesar el pago
  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);

    // Crear objeto con la información de la orden
    const orderData = {
      products: cart.map(item => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        taxRate: item.taxRate || 0.08
      })),
      customer: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone
      },
      shipping: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode
      },
      totals: {
        subtotal,
        taxes,
        total
      }
    };

    const token = localStorage.getItem('userToken');

    // Crear la orden en el backend
    const response = await axios.post(`${link}/api/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 201) {
      // Guardar la orden y pasar al paso 2 (pago)
      setOrder(response.data.order);
      setStep(2); // ✅ Cambiar a paso de pago con Mercado Pago
      
      setAlert({
        show: true,
        type: 'success',
        message: '✅ Orden creada. Procede al pago.'
      });
    } else {
      throw new Error('Error al crear la orden');
    }

  } catch (err) {
    console.log(err.response?.data);
    console.error('Error al procesar la orden:', err);
    setAlert({
      show: true,
      type: 'error',
      message: 'Hubo un error al crear la orden. Por favor intenta nuevamente.'
    });
  } finally {
    setLoading(false);
  }
};

const handlePaymentSuccess = (payment) => {
  console.log('Pago exitoso:', payment);
  localStorage.removeItem('cart');
  setStep(3);
  
  setAlert({
    show: true,
    type: 'success',
    message: '✅ ¡Pago completado exitosamente!'
  });
  
  setTimeout(() => {
    navigate('/Userprofile');
  }, 3000);
};

const handlePaymentError = (error) => {
  console.error('Error en el pago:', error);
  setAlert({
    show: true,
    type: 'error',
    message: 'Hubo un error al procesar tu pago. Por favor intenta de nuevo.'
  });
};


  return (
    <div className="min-h-screen bg-black py-12 pt-28 relative overflow-hidden">
 
      {/* Manchas de luz ambientales */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />
 
      {/* Logo como marca de agua ambiental */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 blur-sm select-none">
        <span className="font-haze uppercase text-[140px] leading-none text-white tracking-wider">
          GG
        </span>
      </div>
 
      <div className="max-w-6xl mx-auto px-4 relative z-10">
 
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${step >= 1 ? 'text-white' : 'text-white/40'}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors
                  ${step >= 1
                    ? 'border-[#FF137A]/60 bg-white/10 backdrop-blur-xl shadow-[0_0_16px_rgba(255,19,122,0.55)]'
                    : 'border-white/20 bg-white/5 backdrop-blur-xl'}`}
              >
                1
              </div>
              <span className="ml-2 font-haze uppercase tracking-wide text-sm hidden sm:inline">Resumen</span>
            </div>
 
            <div className={`w-24 h-px mx-4 ${step >= 2 ? 'bg-white/40' : 'bg-white/10'}`} />
 
            <div className={`flex items-center ${step >= 2 ? 'text-white' : 'text-white/40'}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors
                  ${step >= 2
                    ? 'border-[#FF137A]/60 bg-white/10 backdrop-blur-xl shadow-[0_0_16px_rgba(255,19,122,0.55)]'
                    : 'border-white/20 bg-white/5 backdrop-blur-xl'}`}
              >
                2
              </div>
              <span className="ml-2 font-haze uppercase tracking-wide text-sm hidden sm:inline">Pago</span>
            </div>
 
            <div className={`w-24 h-px mx-4 ${step >= 3 ? 'bg-white/40' : 'bg-white/10'}`} />
 
            <div className={`flex items-center ${step >= 3 ? 'text-white' : 'text-white/40'}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors
                  ${step >= 3
                    ? 'border-[#00FF37]/60 bg-white/10 backdrop-blur-xl shadow-[0_0_16px_rgba(0,255,55,0.55)]'
                    : 'border-white/20 bg-white/5 backdrop-blur-xl'}`}
              >
                3
              </div>
              <span className="ml-2 font-haze uppercase tracking-wide text-sm hidden sm:inline">Confirmación</span>
            </div>
          </div>
        </div>
 
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
          {/* Columna principal */}
          <div className="lg:col-span-2">
 
            {step === 1 && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[20px] p-6">
                <h2 className="font-haze uppercase tracking-wide text-2xl text-white mb-6">Resumen del pedido</h2>
 
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center gap-4 border-b border-white/10 pb-4"
                    >
                      {item.displayImageUrl && (
                        <img
                          src={item.displayImageUrl}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-[20px] border border-white/10"
                        />
                      )}
 
                      {/* Info del producto */}
                      <div className="flex-1">
                        <h3 className="font-Urbanist font-semibold text-white">{item.name}</h3>
 
                        {/* Controles de cantidad */}
                        <div className="flex items-center mt-2">
                          <button
                            onClick={() => decrementQuantity(item._id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20
                              bg-white/5 backdrop-blur-xl text-white transition-colors hover:scale-105
                              hover:border-[#FF137A]/60 hover:shadow-[0_0_12px_rgba(255,19,122,0.5)]"
                          >
                            -
                          </button>
 
                          <span className="w-10 h-8 flex items-center justify-center font-Urbanist text-white/90">
                            {item.quantity}
                          </span>
 
                          <button
                            onClick={() => incrementQuantity(item._id)}
                            disabled={item.quantity >= item.stock}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20
                              bg-white/5 backdrop-blur-xl text-white transition-colors hover:scale-105
                              hover:border-[#00FF37]/60 hover:shadow-[0_0_12px_rgba(0,255,55,0.5)]
                              disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-none"
                          >
                            +
                          </button>
 
                          <span className="ml-2 text-sm font-Urbanist text-white/40">
                            ({item.stock} disponibles)
                          </span>
                        </div>
                      </div>
 
                      {/* Precio y eliminar */}
                      <div className="text-right">
                        <p className="font-Urbanist font-semibold text-white">
                          ${(item.price * item.quantity).toLocaleString("es-CO")}
                        </p>
                        <p className="text-sm font-Urbanist text-white/50">
                          ${item.price.toLocaleString("es-CO")} c/u
                        </p>
 
                        <button
                          onClick={() => removeProduct(item._id)}
                          className="text-sm mt-2 font-Urbanist text-[#FF137A] transition-colors
                            hover:text-[#FF137A] hover:drop-shadow-[0_0_6px_rgba(255,19,122,0.7)]"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
 
                {/* Formulario de contacto */}
                <form onSubmit={handleSubmit}>
                  <h3 className="font-haze uppercase tracking-wide text-lg text-white mb-4">Información de contacto</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Nombre completo"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl
                        text-white font-Urbanist placeholder-white/40 outline-none transition-colors
                        focus:border-[#00FF37]/60 focus:shadow-[0_0_12px_rgba(0,255,55,0.4)]"
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl
                        text-white font-Urbanist placeholder-white/40 outline-none transition-colors
                        focus:border-[#00FF37]/60 focus:shadow-[0_0_12px_rgba(0,255,55,0.4)]"
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Teléfono"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl
                        text-white font-Urbanist placeholder-white/40 outline-none transition-colors
                        focus:border-[#00FF37]/60 focus:shadow-[0_0_12px_rgba(0,255,55,0.4)]"
                    />
                  </div>
 
                  <button
                    type="submit"
                    disabled={loading || cart.length === 0}
                    className="w-full mt-6 py-3 rounded-full font-haze uppercase tracking-wide text-white
                      border border-[#00FF37]/50 bg-white/10 backdrop-blur-xl transition-all
                      hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,55,0.5)]
                      disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed"
                  >
                    {loading ? 'Procesando...' : 'Continuar al pago'}
                  </button>
                </form>
              </div>
            )}
 
            {step === 2 && order && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[20px] p-6">
                <h2 className="font-haze uppercase tracking-wide text-2xl text-white mb-6">Realizar pago</h2>
 
                <div className="mb-6">
                  <p className="font-Urbanist text-white/60 mb-2">
                    Orden: <span className="font-semibold text-white">#{order._id?.slice(-8)}</span>
                  </p>
                  <p className="font-Urbanist text-2xl font-bold text-white">
                    Total: ${total.toLocaleString('es-CO')} COP
                  </p>
                </div>
 
                {/* Componente de Mercado Pago */}
                <MercadoPagoCheckout
                  orderId={order._id}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
 
                <button
                  onClick={() => setStep(1)}
                  className="w-full mt-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl
                    text-white/80 font-Urbanist py-2 transition-colors hover:border-white/40 hover:text-white"
                >
                  ← Volver al resumen
                </button>
              </div>
            )}
 
            {step === 3 && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[20px] p-8 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4
                  border border-[#00FF37]/50 bg-white/10 backdrop-blur-xl shadow-[0_0_24px_rgba(0,255,55,0.5)]">
                  <svg className="w-10 h-10 text-[#00FF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-haze uppercase tracking-wide text-3xl text-[#00FF37] drop-shadow-[0_0_10px_rgba(0,255,55,0.6)] mb-4">
                  ¡Pago exitoso!
                </h2>
                <p className="font-Urbanist text-white/60 mb-6">
                  Tu pedido ha sido procesado correctamente.
                  <br />
                  Los códigos de tus juegos están disponibles en tu perfil.
                </p>
                <button
                  onClick={() => navigate('/Userprofile')}
                  className="rounded-full px-8 py-3 font-haze uppercase tracking-wide text-white
                    border border-[#FF137A]/50 bg-white/10 backdrop-blur-xl transition-all
                    hover:scale-105 hover:shadow-[0_0_20px_rgba(255,19,122,0.5)]"
                >
                  Ver mis productos
                </button>
              </div>
            )}
 
          </div>
 
          {/* Columna lateral - resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[20px] p-6 sticky top-4">
              <h3 className="font-haze uppercase tracking-wide text-xl text-white mb-4">Resumen de compra</h3>
 
              <div className="space-y-2 mb-4 font-Urbanist">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Impuestos</span>
                  <span className="font-medium text-white/80">${taxes.toLocaleString('es-CO')}</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>Total</span>
                    <span>${total.toLocaleString('es-CO')} COP</span>
                  </div>
                </div>
              </div>
 
              <div className="text-sm font-Urbanist text-white/40 mb-4">
                <p className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-[#00FF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Entrega inmediata
                </p>
                <p className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00FF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Pago 100% seguro
                </p>
              </div>
            </div>
          </div>
 
        </div>
 
        {/* Alerta */}
        {alert.show && (
          <div
            className={`fixed bottom-6 right-6 px-5 py-3 rounded-full font-Urbanist text-white
              backdrop-blur-xl bg-black/50 border transition-all duration-300 ${
              alert.type === 'success' ? 'border-[#00FF37]/60 shadow-[0_0_16px_rgba(0,255,55,0.5)]' :
              alert.type === 'warning' ? 'border-yellow-400/60 shadow-[0_0_16px_rgba(250,204,21,0.4)]' :
              'border-[#FF137A]/60 shadow-[0_0_16px_rgba(255,19,122,0.5)]'
            }`}
          >
            {alert.message}
          </div>
        )}
      </div>
    </div>
  );
};
 
export default Checkout;