import React from 'react';
import { Home, Package, Edit, Plus, ShoppingBag, FileText } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import logo from '../assets/BLogo4k-white.png'
 
const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const currentPath = location.pathname;
 
  return (
    <div
      className={`fixed md:relative z-30 h-full transition-all duration-300 ease-in-out  ${
        isOpen
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0"
      }`}
      style={{ fontFamily: '"Urbanist", sans-serif' }}
    >
      <div className="relative flex flex-col h-full w-68 bg-[#000000] overflow-hidden ">
        {/* Manchas de luz neón difuminadas */}
        <div className="pointer-events-none absolute -top-24 -right-36 w-85 h-82 rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />
 
        {/* Marca de agua ambiental (logo/decoración) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-50 blur-sm">
          <img src={logo} alt="logo" />
        </div>
 
        <div className="relative flex items-center justify-center h-16 px-6 mt-8 mb-8 ">
          <h1 className="font-haze uppercase text-4xl tracking-wide text-white">
            Dash<span className="text-[#00FF37]">board</span>
          </h1>
        </div>
 
        <nav className="relative flex-1 px-4 pb-4 ">
          <div className="space-y-2">
            <SidebarItem
              icon={<Home size={20} />}
              text="Dashboard"
              to="/dashboard"
              active={currentPath === "/dashboard" || currentPath === "/"}
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
 
// Item individual del sidebar
const SidebarItem = ({ icon, text, to, active = false }) => {
  return (
    <a
      href={to}
      className={`group flex items-center w-full h-15 px-4 rounded-lg border transition-colors hover:scale-105 transform duration-200 ${
        active
          ? "bg-white/10 backdrop-blur-md border-[#00FF37]/40 shadow-[0_0_12px_-2px_#00FF37]"
          : "bg-transparent border-white/20 hover:bg-white/10 hover:backdrop-blur-md"
      }`}
    >
      <span
        className={`transition-colors ${
          active ? "text-[#00FF37]" : "text-white font-semibold group-hover:text-[#FF137A]"
        }`}
      >
        {icon}
      </span>
      <span
        className={`ml-3 font-Urbanist text-sm truncate ${
        active ? "text-white font-semibold" : "text-white font-semibold"
        }`}
      >
        {text}
      </span>
    </a>
  );
};
 
export default Sidebar;