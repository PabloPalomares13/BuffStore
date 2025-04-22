import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logobuff0033.png'
import {useNavigate} from 'react-router-dom'

const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'

const Register = () => {
  const [formData, setFormData] = useState({
    typeID: '',
    personalID: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

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
    
    if (formData.personalID && formData.personalID.trim().length < 7) {
      newErrors.personalID = 'El ID debe tener al menos 7 caracteres';
    }
    
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
      formData.personalID &&
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
        typeID: formData.typeID,
        personalID: formData.personalID,
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem('userToken', response.data.token);
      console.log('Registration successful:', response.data);
      navigate('/login')
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      // Handle registration errors
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
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md backdrop-blur-sm bg-opacity-80">
          <h2 className="text-3xl font-bold text-center mb-2">Crear una cuenta</h2>
          <p className="text-gray-500 text-center mb-8">
            Que alegria tener un nuevo usuario!!
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-1">Tipo Documento</label>
                <div className="relative">
                    <select
                    id="category"
                    name="typeID"
                    value={formData.typeID}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 appearance-none"
                    >
                    <option value="">Seleccionar...</option>
                    <option value="Targeta de Identidad">Tarjeta de Identidad</option>
                    <option value="Cedula de ciudadania">Cedula de ciudadania</option>
                    <option value="Cedula de extranjeria">Cedula de extranjeria</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    </div>
                </div>
            </div>

            <div>
            <label htmlFor="text" className="block text-sm font-medium text-gray-400 mb-1">Numero Documento</label>
              <input
                type="text"
                name="personalID"
                placeholder="ID personal"
                value={formData.personalID}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.personalID ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.personalID}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Correo Electronico</label>
              <input
                type="email"
                name="email"
                placeholder="Correo electronico"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                placeholder="Escribe una contraseña"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">Confirmar Contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirma la contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full py-3 rounded-lg text-white font-medium ${
                isFormValid 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Sign Up
            </button>
            
            
            <p className="text-center text-gray-600">
              Ya tienes una cuenta?{' '}
              <Link to="/login" className="text-purple-600 font-medium hover:underline">
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