
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/BLogo4K-white.png'
import {useNavigate} from 'react-router-dom'
import { mergeFavoritesOnLogin } from '../components/hooks/favorites';
const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'

const Login = () => {

  useEffect(() => {
  const token = localStorage.getItem('userToken');
  const role = localStorage.getItem('userRole');
  if (token) {
    if (role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/home');
    }
  }
  }, []);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

   const navigate = useNavigate()

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    return passwordRegex.test(password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  useEffect(() => {
    const newErrors = {};
    
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.password && !validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters with letters and numbers';
    }

    setErrors(newErrors);
    
    
    const formValid = 
      formData.email && 
      formData.password && 
      Object.keys(newErrors).length === 0;
    
    setIsFormValid(formValid);
  }, [formData]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!isFormValid) return;

  try {
    const response = await axios.post(`${link}/api/auth/login`, {
      email: formData.email,
      password: formData.password
    });

    // Guardar token y rol
    localStorage.setItem('userToken', response.data.token);
    localStorage.setItem('userRole', response.data.role);
    await mergeFavoritesOnLogin(); // sincroniza antes de navegar
    // Mostrar alerta de éxito
    setAlert({
      show: true,
      type: 'success',
      message: 'Inicio de sesión exitoso 🎉 Redirigiendo...'
    });

    // Redirigir según el rol después de un pequeño delay
    setTimeout(() => {
      if (response.data.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/home');
      }
    }, 1500);

  } catch (error) {
    console.error('Error al iniciar sesión:', error);

    setAlert({
      show: true,
      type: 'error',
      message: 'Correo o contraseña incorrectos ❌'
    });

    // Ocultar alerta después de 3 segundos
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 1500);
  }
};

  return (
  <div className="relative flex flex-col lg:flex-row min-h-screen bg-gradient-to-l from-[#00ff37] to-[#000000] overflow-hidden"
    style={{ fontFamily: '"Urbanist", sans-serif' }}>

    {alert.show && (
      <div
        role="status"
        className={`fixed top-6 right-6 z-50 w-[340px] overflow-hidden rounded-[20px] border border-white/15 bg-black/60 backdrop-blur-2xl font-Urbanist text-white shadow-2xl transition-all duration-500 transform ${
          alert.show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
        }`}
      >
        {/* Acento superior */}
        <div
          className={`h-[3px] w-full ${
            alert.type === 'success' ? 'bg-[#00FF37]' : 'bg-[#FF137A]'
          }`}
        />

        <div className="flex items-start gap-3 p-4">
          {/* Insignia con halo */}
          <div className="relative shrink-0">
            <div
              className={`absolute inset-0 rounded-full blur-md ${
                alert.type === 'success' ? 'bg-[#00FF37]/50' : 'bg-[#FF137A]/50'
              }`}
            />
            <div
              className={`relative flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md ${
                alert.type === 'success'
                  ? 'bg-[#00FF37]/10 border-[#00FF37]/40 text-[#00FF37]'
                  : 'bg-[#FF137A]/10 border-[#FF137A]/40 text-[#FF137A]'
              }`}
            >
              {alert.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a1 1 0 00.86 1.5h18.64a1 1 0 00.86-1.5L13.71 3.86a1 1 0 00-1.72 0z" />
                </svg>
              )}
            </div>
          </div>

          {/* Texto */}
          <div className="flex-1 pt-0.5">
            <p className="font-haze text-sm text-white leading-none tracking-widest">
              {alert.type === 'success' ? 'Listo' : 'Algo salio mal'}
            </p>
            <p className="text-sm text-white/60 leading-snug">{alert.message}</p>
          </div>
    
        </div>

        {/* Barra de progreso (auto-dismiss) */}
        <div className="h-[2px] w-full bg-white/10">
          <div
            className={`h-full ${alert.type === 'success' ? 'bg-[#00FF37]' : 'bg-[#FF137A]'}`}
            style={{
              animation: alert.show ? 'toast-drain 4s linear forwards' : 'none',
            }}
          />
        </div>
      </div>
    )}

    <div className="lg:hidden w-full px-6 pt-8 text-white text-center">
          <a href="/home" className="inline-block">
            <img src={logo} alt="logo" className="w-28 mx-auto rounded-[20px] py-1 mb-4 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl" />
          </a>
          <h2 className="font-haze text-3xl mb-2 leading-tight">Hey! Hola Parcero!</h2>
          <p className="font-Urbanist text-base text-white/70 max-w-sm mx-auto">
            Unete a la tienda de claves de video juegos y microtransacciones mas grande de Latam!
          </p>
        </div>
    
        {/* Panel izquierdo — solo pantallas grandes */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 text-white relative">
          <img
            src={logo}
            alt=""
            className="pointer-events-none select-none absolute -right-10 top-1/2 -translate-y-1/2 w-[420px] opacity-10 blur-[2px]"
          />
          <a href="/home" className="relative z-10">
            <img src={logo} alt="logo" className="w-40 rounded-[20px] py-1 mb-8 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl" />
          </a>
          <h2 className="relative z-10 font-haze text-5xl mb-6 leading-tight">Hey! Hola Parcero!</h2>
          <p className="relative z-10 font-Urbanist text-2xl max-w-md">
            Unete a la tienda de claves de video juegos y microtransacciones mas grande de Latam!
          </p>
          <p className="hidden lg:block relative z-10 font-Urbanist text-lg text-white/70 max-w-md">
            Te damos las mejores ofertas y las mas exclusivas para ti.
            Unete a nuestra comunidad de gamers y disfruta de la mejor experiencia de compra.
          </p>
        </div>

    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
      <div className="bg-black/70 backdrop-blur-xl border border-white/20 rounded-[28px] shadow-2xl p-8 w-full max-w-md">
        <h2 className="font-haze-defog text-3xl text-white text-center mb-2 tracking-wider">Bienvenido de nuevo</h2>
        <p className="font-Urbanist text-white/60 text-center mb-8">
          Un placer tenerte de vuelta
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 font-Urbanist">
          <div>
            <label htmlFor="email" className="block text-md text-white mb-1">Correo Electronico</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Escribe tu Correo Electronico"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-4 rounded-full border bg-white/10 text-white placeholder-white/60 outline-none transition-colors ${
                errors.email ? 'border-[#FF137A]' : 'border-white/20'
              } focus:ring-0.8 focus:ring-[#00FF37] focus:border-[#00FF37]`}
            />
            {errors.email && (
              <p className="text-[#00FF37] text-sm mt-1">Ingresa un correo electronico valido</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-white mb-1">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Escribe tu contraseña"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-4 rounded-full border bg-white/10 text-white placeholder-white/60 outline-none transition-colors ${
                errors.password ? 'border-[#FF137A]' : 'border-white/20'
              } focus:ring-0.8 focus:ring-[#00FF37] focus:border-[#00FF37]`}
            />
            {errors.password && (
              <p className="text-[#00FF37] text-sm mt-1 "> La combinación de correo y/o contraseña ingresada no coincide con ninguna cuenta. Inténtelo de nuevo.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-4 rounded-full font-haze text-white transition-all duration-300 ${
              isFormValid
                ? 'bg-[#00FF37] shadow-[0_0_25px_-5px_rgba(0,255,55,0.6)] hover:scale-[1.02] tracking-widest'
                : 'bg-white/10 text-white/40 cursor-not-allowed tracking-wider'
            }`}
          >
            Iniciar Sesion
          </button>

          <p className="text-center text-white/60">
            No tienes una cuenta aun?{' '}
            <Link to="/Register" className="text-[#FF137A] font-bold hover:underline">
              Registrate Gratis
            </Link>
          </p>
        </form>
      </div>
    </div>
  </div>
);
};

export default Login;