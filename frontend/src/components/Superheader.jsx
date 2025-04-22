import React, { useState, useEffect } from 'react';
import { Menu, X, Bell, User, Settings, Home, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logobuff0033.png';

const Superheader = ({ isScrolled, isMobileView, isSidebarOpen, toggleSidebar }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated on component mount
    const token = localStorage.getItem('userToken');
    setIsAuthenticated(!!token);
  }, []);

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    
    localStorage.removeItem('userToken');
    
    setIsAuthenticated(false);
    
    navigate('/login');
  };

  const navigateTo = (path, e) => {
    e.preventDefault();
    setIsProfileMenuOpen(false); 
    navigate(path);
  };

  return (
    <header
      className={`w-full z-20 transition-all duration-300 ${
        isScrolled
          ? "bg-white/40 shadow-md backdrop-blur-md"
          : "bg-white/20 backdrop-blur-lg shadow-lg"
      }`}
    >
      <div className="flex items-center justify-between h-22 px-6">
        <div className="flex items-center">
          {isMobileView && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-700 hover:bg-white/30 transition-colors"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
          
          <a 
            href="/" 
            onClick={(e) => navigateTo('/', e)}
            className="ml-4 md:ml-0"
          >
            <img
              src={logo}
              alt="logo"
              className="h-18 w-auto rounded-2xl bg-opacity-80"
            />
          </a>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <>
              <button className="p-4 rounded-full text-gray-700 hover:bg-white/30 transition-colors">
                <Bell size={25} />
              </button> 
              
              <div className="relative">
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center focus:outline-none"
                >
                  <div className="w-12 h-12 relative overflow-hidden rounded-full bg-gradient-to-r from-blue-400 to-pink-400 p-0.5">
                    <img 
                      src="/api/placeholder/30/30" 
                      alt="User profile" 
                      className="rounded-full object-cover w-full h-full"
                    />
                  </div>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/80 backdrop-blur-lg rounded-md shadow-lg py-1 border border-white/30 z-50">
                    <a
                      href="/checkout"
                      onClick={(e) => navigateTo('/checkout', e)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors"
                    >
                      <span className="mr-2"><User size={16} /></span>
                      Mi carrito
                    </a>
                    <a
                      href="/dashboard"
                      onClick={(e) => navigateTo('/dashboard', e)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors"
                    >
                      <span className="mr-2"><Settings size={16} /></span>
                      Dashboard
                    </a>
                    <a
                      href="/home"
                      onClick={(e) => navigateTo('/home', e)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-white/50 transition-colors"
                    >
                      <span className="mr-2"><Home size={16} /></span>
                      Main Page
                    </a>
                    <div className="border-t border-gray-200"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <span className="mr-2"><LogOut size={16} /></span>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Superheader;