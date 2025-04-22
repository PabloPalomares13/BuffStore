import React from 'react';
import { Home, Package, Edit, Plus, ShoppingBag, FileText } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div 
      className={`fixed md:relative z-30 h-full transition-all duration-300 ease-in-out ${
        isOpen 
          ? "translate-x-0" 
          : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex flex-col h-full w-64 bg-white/20 backdrop-blur-lg shadow-lg border-r border-white/30 overflow-hidden">
        <div className="flex items-center justify-center h-16 px-6 mt-2 mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">DashBoard</h1>
        </div>

        <nav className="flex-1 px-4 pb-4">
          <div className="space-y-2">
            <SidebarItem 
              icon={<Home size={20} />} 
              text="Dashboard" 
              to="/Dashboard" 
              active={currentPath === "/Dashboard"} 
            />
            <SidebarItem 
              icon={<Package size={20} />} 
              text="Lista de productos" 
              to="/ListaProductos" 
              active={currentPath === "/ListaProductos"} 
            />
            <SidebarItem 
              icon={<Edit size={20} />} 
              text="Modificación de productos" 
              to="/ModProducto" 
              active={currentPath === "/ModProducto"} 
            />
            <SidebarItem 
              icon={<Plus size={20} />} 
              text="Nuevo producto" 
              to="/NewProduct" 
              active={currentPath === "/NewProduct"} 
            />
            <SidebarItem 
              icon={<ShoppingBag size={20} />} 
              text="Lista de Ordenes" 
              to="/listaordenes" 
              active={currentPath === "/listaordenes"} 
            />
            <SidebarItem 
              icon={<FileText size={20} />} 
              text="Detalles de pedido" 
              to="/Detallesorden" 
              active={currentPath === "/Detallesorden"} 
            />
          </div>
        </nav>
      </div>
    </div>
  );
};

// Component for sidebar items
const SidebarItem = ({ icon, text, to, active = false }) => {
  return (
    <a
      href={to}
      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
        active 
          ? "bg-gradient-to-r from-blue-500/20 to-pink-500/20 text-gray-800" 
          : "text-gray-700 hover:bg-white/30"
      }`}
    >
      <span className={`${active ? "text-blue-600" : "text-gray-600"}`}>
        {icon}
      </span>
      <span className="ml-3 font-medium">{text}</span>
    </a>
  );
};

export default Sidebar;