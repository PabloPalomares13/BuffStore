import React from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route , Navigate } from 'react-router-dom';


import DashboardLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Listaproductos from './pages/Listaproductos';
import Modproducto from './pages/Modproducto';
import Listaordenes from './pages/Listaordenes';
import Detallesorden from './pages/Detallesorden';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import ChatBot from './pages/ChatBot';

import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import NewProduct from './pages/NewProduct';
import AuthLayout from './layouts/AuthLayout';

import ProtectedRoute from './components/ProtectedRoute';
import ProductDetail from './pages/ProductDetail';

function App() {
  return (
  <Router>
    <ChatBot />
    <Routes>

    <Route element={<MainLayout/>}>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/product/:id" element={<ProductDetail />} />

    </Route>

      
    <Route element={<DashboardLayout/>}>
      <Route path="/Dashboard" element={<ProtectedRoute requiredRole="admin"><Dashboard /></ProtectedRoute>} />
      <Route path="/NewProduct" element={<ProtectedRoute requiredRole="admin"><NewProduct /></ProtectedRoute>} />
      <Route path="/Listaproductos" element={<ProtectedRoute requiredRole="admin"><Listaproductos /></ProtectedRoute>} />
      <Route path="/Modproducto/:id" element={<ProtectedRoute requiredRole="admin"><Modproducto /></ProtectedRoute>} />
      <Route path="/Modproducto" element={<ProtectedRoute requiredRole="admin"><Modproducto /></ProtectedRoute>} />
      <Route path="/Listaordenes" element={<ProtectedRoute requiredRole="admin"><Listaordenes /></ProtectedRoute>} />
      <Route path="/Detallesorden" element={<ProtectedRoute requiredRole="admin"><Detallesorden /></ProtectedRoute>} />
      <Route path="/Detallesorden/:id" element={<ProtectedRoute requiredRole="admin"><Detallesorden /></ProtectedRoute>} />
    </Route>

    <Route element={<AuthLayout/>}>
      <Route path="/Login" element={<Login />} />
      <Route path="/Register" element={<Register />} />
    </Route>

    </Routes>
  </Router>
  );
};

export default App
