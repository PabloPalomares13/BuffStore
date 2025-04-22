
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logobuff0033.png'
import {useNavigate} from 'react-router-dom'

const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'

const Login = () => {
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
      console.log('Login successful:', response.data);
      localStorage.setItem('userToken', response.data.token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      setAlert({ show: true, type: 'error', message: `Email o contraseña incorrectos${error.message}` });
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-600 to-purple-500">
      
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 text-white">
         <a href="/home" className=""> <img src={logo} alt="logo" className="w-100 rounded-2xl py-1 mb-6 bg-opacity-80 shadow-xl bg-white/20" /></a>
        <h2 className="text-5xl font-bold mb-6">Hey, Hola Parcero!</h2>
        <p className="text-2xl mb-4">Unete a la tienda de claves de video juegos y microtransacciones mas grande de Latam!</p>
        <p className="text-lg opacity-80">
          Te damos las mejores ofertas y las mas exclusivas para ti.
          Unete a nuestra comunidad de gamers y disfruta de la mejor experiencia de compra.
        </p>
      </div>
      
      
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
          <h2 className="text-3xl font-bold text-center mb-2">Bienvenido de nuevo</h2>
          <p className="text-gray-500 text-center mb-8">
            Un placer tenerte de vuelta 
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Correo Electronico</label>
              <input
                type="email"
                name="email"
                placeholder="Escribe tu Correo Electronico"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-4 rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            
            <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                placeholder="Escribe tu contraseña"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-4 rounded-lg border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            
            
            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full py-4 rounded-lg text-white font-medium ${
                isFormValid 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Iniciar Sesion
            </button>
            
            
            
            <p className="text-center text-gray-600">
              No tienes una cuenta aun?{' '}
              <Link to="/Register" className="text-purple-600 font-medium hover:underline">
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