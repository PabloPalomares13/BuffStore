import React, { useState, useEffect } from 'react';
import { Menu, X, Bell, User, Settings, Home, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/BLogo4K-white.png';

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
      className={`relative w-full z-20 transition-all duration-300 rounded-[20px]  ${
        isScrolled
          ? "bg-black/70 backdrop-blur-md"
          : "bg-black/50 backdrop-blur-lg"
      }`}
    >
      {/* Manchas de luz neón difuminadas (contenedor propio recortado, no corta el resto del header) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#000000] ">
        <div className="absolute -top-25 left-[-8%] w-85 h-85 rounded-full bg-[#FF137A] opacity-40 blur-[120px] " />
         <div className="absolute -top-16 inset-x-0 mx-auto w-72 h-72 rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />
        <div className="absolute -top-16 right-[-10%] w-72 h-72 rounded-full bg-[#FF137A] opacity-40 blur-[120px] " />
      </div>
 
      <div className="relative flex items-center justify-between h-22 px-6">
        <div className="flex items-center">
          {isMobileView && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full border border-white/20 text-white/80 hover:bg-white/10 hover:backdrop-blur-md transition-colors hover:scale-105 transform duration-200"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
 
          <a
            href="/"
            onClick={(e) => navigateTo('/', e)}
            className="ml-4 md:0"
          >
            <img
              src={logo}
              alt="logo"
              className="h-18 w-auto rounded-2xl opacity-90 "
            />
          </a>
        </div>
 
        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <>
              <button className="p-3 rounded-full border border-white/20 text-white/80 hover:bg-white/10 hover:backdrop-blur-md hover:text-[#FF137A] transition-colors hover:scale-105 transform duration-200">
                <Bell size={22} />
              </button>
 
              <div className="relative">
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center focus:outline-none hover:scale-105 transform transition-colors duration-200"
                >
                  <div className="w-11 h-11 relative overflow-hidden rounded-full border border-white/20 shadow-[0_0_12px_-2px_#00FF37] p-0.5">
                    <img
                      src="/api/placeholder/30/30"
                      alt="User profile"
                      className="rounded-full object-cover w-full h-full"
                    />
                  </div>
                </button>
 
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-lg rounded-[20px] border border-white/20 py-1 z-50">
                    <a
                      href="/checkout"
                      onClick={(e) => navigateTo('/checkout', e)}
                      className="flex items-center px-4 py-2 text-sm font-Urbanist text-white/80 hover:bg-white/10 hover:text-[#00FF37] transition-colors"
                    >
                      <span className="mr-2"><User size={16} /></span>
                      Mi carrito
                    </a>
                    <a
                      href="/userprofile"
                      onClick={(e) => navigateTo('/userprofile', e)}
                      className="flex items-center px-4 py-2 text-sm font-Urbanist text-white/80 hover:bg-white/10 hover:text-[#00FF37] transition-colors"
                    >
                      <span className="mr-2"><Settings size={16} /></span>
                      Mi perfil
                    </a>
                    <a
                      href="/home"
                      onClick={(e) => navigateTo('/home', e)}
                      className="flex items-center px-4 py-2 text-sm font-Urbanist text-white/80 hover:bg-white/10 hover:text-[#00FF37] transition-colors"
                    >
                      <span className="mr-2"><Home size={16} /></span>
                      Main Page
                    </a>
                    <div className="border-t border-white/20"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-sm font-Urbanist text-[#FF137A] hover:bg-white/10 transition-colors w-full text-left"
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