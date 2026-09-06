import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/BLogo4k-white.png'
import {useNavigate} from 'react-router-dom'

const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [alert, setAlert] = useState({
  show: false,
  type: '', // 'success' | 'error'
  message: '',
});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // At least 6 characters, containing both letters and numbers
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
  const navigate = useNavigate()

  useEffect(() => {
    const newErrors = {};
    
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Ingresa un email valido';
    }
    
    if (formData.password && !validatePassword(formData.password)) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres, con letras y números';
    }
    
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'La contraseña de confirmación no coincide';
    }
    
    setErrors(newErrors);
    
    // Form is valid if all fields are filled and there are no errors
    const formValid = 
      formData.email && 
      formData.password &&
      formData.confirmPassword &&
      Object.keys(newErrors).length === 0;
    
    setIsFormValid(formValid);
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) return;
    
    try {
      const response = await axios.post(`${link}/api/auth/register` , {
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem('userToken', response.data.token);
      console.log('Registration successful:', response.data);
      setAlert({ show: true, type: 'success', message: 'Cuenta creada correctamente' });
      setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 4000);
      navigate('/login')
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      setAlert({ show: true, type: 'error', message: 'No pudimos crear tu cuenta ',detail: error.response?.data?.message || error.response?.data || error.message, });
      setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 4000);
      // Handle registration errors
    }
  };

  return (
  <div className="relative flex flex-col lg:flex-row min-h-screen bg-gradient-to-r from-[#FF137A] to-[#000000] overflow-hidden"
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
            <p className="font-haze text-sm text-white leading-none mb-1">
              {alert.type === 'success' ? 'Listo' : 'Algo salio mal'}
            </p>
            <p className="text-sm text-white/60 leading-snug">{alert.message}</p>
            {alert.detail && (
              <p className="text-xs text-white/40 leading-snug mt-1">{String(alert.detail)}</p>
            )}
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
      <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-[28px] shadow-2xl p-8 w-full max-w-md">
        <h2 className="font-haze-defog text-3xl text-white text-center mb-2 tracking-wider">Crear una cuenta</h2>
        <p className="font-Urbanist text-white/60 text-center mb-8">
          Que alegria tener un nuevo usuario!!
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 font-Urbanist">
          <div>
            <label htmlFor="email" className="block text-md text-white mb-1">Correo Electronico</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Correo electronico"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-full border bg-white/5 text-white placeholder-white/60 outline-none transition-colors ${
                errors.email ? 'border-[#FF137A]' : 'border-white/20'
              } focus:ring-.8 focus:ring-[#00FF37] focus:border-[#00FF37]`}
            />
            {errors.email && (
              <p className="text-[#FF137A] text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-md text-white mb-1">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Escribe una contraseña"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-full border bg-white/5 text-white placeholder-white/60 outline-none transition-colors ${
                errors.password ? 'border-[#FF137A]' : 'border-white/20'
              } focus:ring-.8 focus:ring-[#00FF37] focus:border-[#00FF37]`}
            />
            {errors.password && (
              <p className="text-[#FF137A] text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-md text-white mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirma la contraseña"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-full border bg-white/5 text-white placeholder-white/40 outline-none transition-colors ${
                errors.confirmPassword ? 'border-[#FF137A]' : 'border-white/20'
              } focus:ring-0.8 focus:ring-[#00FF37] focus:border-[#00FF37]`}
            />
            {errors.confirmPassword && (
              <p className="text-[#FF137A] text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-4 rounded-full font-haze text-white transition-all duration-300 tracking-widest ${
              isFormValid
                ? 'bg-[#FF137A] shadow-[0_0_25px_-5px_rgba(255,19,122,0.6)] hover:scale-[1.02]'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            Crear Cuenta
          </button>

          <p className="text-center text-white/60">
            Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-[#00FF37] font-medium hover:underline">
              Iniciar Sesion
            </Link>
          </p>
        </form>
      </div>
    </div>
  </div>
);
};

export default Register;