import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';


const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'
const Checkout = () => {
  // Estados para carrito y datos de formulario
  const [cart, setCart] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

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

      // Crear objeto con la información de la venta
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
        payment: {
          cardName: formData.cardName,

          cardLast4: formData.cardNumber.slice(-4)
        },
        totals: {
          subtotal,
          taxes,
          total
        }
      };
      const response = await axios.post(`${link}/api/orders`, orderData);

      if (response.status === 201) {
        console.log('Orden creada exitosamente');

        // Limpiar carrito después de procesar el pago
        localStorage.removeItem('cart');

        // Mostrar mensaje de éxito
        alert('¡Pago procesado con éxito!');

        // Redireccionar a página de confirmación
        window.location.href = '/';
      } else {
        throw new Error('Error al crear la orden');
      }

    } catch (err) {
      console.error('Error al procesar el pago:', err);
      alert('Hubo un error al procesar el pago. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 py-12 pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi carrito de compras 🛒</h1>
          <p className="mt-2 text-gray-600">Completa tu compra</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : cart.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Tu carrito está vacío</h2>
            <p className="mb-6">No tienes productos en tu carrito de compras.</p>
            <Link 
              to="/"
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Volver a la tienda
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna izquierda: Productos */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Productos seleccionados</h2>
                
                {cart.map(product => (
                  <div key={product._id} className="flex items-center border-b py-4 last:border-b-0">
                    <div className="w-20 h-20 flex-shrink-0">
                      {product.displayImageUrl && (
                        <img 
                          src={product.displayImageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover rounded-md" 
                        />
                      )}
                    </div>
                    
                    <div className="ml-4 flex-grow">
                      <h3 className="font-medium text-gray-800">{product.name}</h3>
                      <p className="text-gray-600 text-sm">Precio: ${product.price.toFixed(2)}</p>
                      
                      <div className="flex items-center mt-2">
                        <button 
                          onClick={() => decrementQuantity(product._id)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-l-md border border-gray-300"
                        >
                          -
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center border-t border-b border-gray-300">
                          {product.quantity}
                        </span>
                        <button 
                          onClick={() => incrementQuantity(product._id)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-r-md border border-gray-300"
                          disabled={product.quantity >= product.stock}
                        >
                          +
                        </button>
                        <span className="ml-2 text-sm text-gray-500">
                          ({product.stock} disponibles)
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <p className="font-medium text-gray-800">${(product.price * product.quantity).toFixed(2)}</p>
                      <button 
                        onClick={() => removeProduct(product._id)}
                        className="text-red-500 text-sm mt-2 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Formulario de checkout */}
              <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Información personal</h2>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Dirección de facturación</h2>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                          Ciudad
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                          Departamento/Estado
                        </label>
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                        Código postal
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Detalles de pago</h2>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre en la tarjeta
                      </label>
                      <input
                        type="text"
                        id="cardName"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Número de tarjeta
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        id="cardNumber"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="1234 5678 9012 3456"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de expiración (MM/YY)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          id="expiryDate"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="MM/YY"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">
                          CVC
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          id="cvc"
                          name="cvc"
                          value={formData.cvc}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="123"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Columna derecha: Resumen */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Resumen de la orden</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-4">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${Number(subtotal).toLocaleString('en-US')}</span>
                  </div>
                  
                  <div className="flex justify-between border-b pb-4">
                    <span className="text-gray-600">Impuestos</span>
                    <span className="font-medium">${Number(taxes).toLocaleString('en-US')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-semibold">${Number(total).toLocaleString('en-US')}</span>
                  </div>
                </div>
                
                <button
                  type="submit"
                  onClick={handleSubmit}
                  style={{ backgroundImage: "linear-gradient(90deg,rgba(189, 157, 212, 1) 0%, rgba(125, 209, 199, 1) 99%)"}}
                  className="w-full mt-6 py-3 px-4 text-white rounded-lg hover:opacity-90 transition-opacity duration-300 font-medium"
                >
                  Confirmar compra
                </button>
                
                <div className="mt-4 text-center">
                  <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm">
                    Seguir comprando
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;