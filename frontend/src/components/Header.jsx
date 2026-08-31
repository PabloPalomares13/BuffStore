
import { useState, useEffect, useRef } from "react";
import {
  Search,
  User,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  ShoppingCart,
  Menu,
  X,
} from "lucide-react";
import logo from "../assets/BLogo4k-white.png";
 
export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
 
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);
  const profileRef = useRef(null);
 
    const lastScrollY = useRef(0);
  // Auth + scroll state (misma lógica que tenías)
    useEffect(() => {
    const token = localStorage.getItem("userToken");
    const role = localStorage.getItem("userRole");

    setIsAuthenticated(!!token);

    if (role) {
      setUserRole(role);
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Si estamos arriba de la página,
      // el header SIEMPRE debe estar visible
      if (currentScrollY <= 20) {
      setIsHeaderHidden(false);
      setIsScrolled(false);
      lastScrollY.current = currentScrollY;
      return;
      }

      setIsScrolled(true);

      const topThreshold = (window.innerHeight * 2) / 5;

      if (currentScrollY < topThreshold) {
      // Todavía no hemos recorrido el 20%
      // desde el top → mantener header visible
      setIsHeaderHidden(false);

      lastScrollY.current = currentScrollY;
      return;
    }
      // Scroll hacia ABAJO
      if (currentScrollY > lastScrollY.current) {
        setIsHeaderHidden(true);
      }

      // Scroll hacia ARRIBA
      else if (currentScrollY < lastScrollY.current) {
        setIsHeaderHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
 
  // Cerrar buscador / menú de usuario al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
 
  // Cerrar buscador con Escape + autofocus al abrir
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isSearchOpen]);
 
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    setIsProfileMenuOpen(false);
    window.location.href = "/login";
  };
 
  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Juegos", href: "#" },
    { name: "Categorias", href: "#" },
    { name: "Nosotros", href: "/Dashboard" },
  ];
 
  return (
    <header
      style={{ fontFamily: '"Urbanist", sans-serif' }}
      className={`
        fixed top-0 left-0 w-full z-50
        transform
        transition-all
        duration-300
        ease-out
        will-change-transform
        ${
          isHeaderHidden
            ? "-translate-y-full"
            : "translate-y-0"
        }
        ${
          isScrolled
            ? "bg-white/6 shadow-md backdrop-blur-sm"
            : "bg-white/2 backdrop-blur-lg shadow-lg"
        }
      `}
    >
      <div className="mx-auto max-w-[104rem] px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-20 items-center justify-between">
          {/* Menú móvil (izquierda en celular/tablet) */}
          <button
            onClick={() => setIsMenuOpen((v) => !v)}
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-full text-white/85 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Abrir menú"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
 
          {/* Logo: centrado en móvil/tablet, a la izquierda en desktop */}
          <a
            href="/home"
            className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center shrink-0"
          >
            <img src={logo} alt="Buff Store" className="h-18 w-auto" />
          </a>
 
          {/* Nav + buscador expandible (solo desktop) */}
            <div
                ref={searchWrapRef}
                className="hidden md:flex relative items-center mx-8 h-13 w-[34rem] rounded-full bg-white/10 backdrop-blur-md border border-white/10 overflow-hidden"
                >
                {/* Links: mismo espacio entre ellos que en los bordes */}
                <nav
                    className={`flex flex-1 min-w-0 items-center justify-evenly px-5 transition-opacity duration-300 ${
                    isSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100"
                    }`}
                >
                    {navLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.href}
                        className="text-md text-white/90 hover:text-white/40 transition-colors "
                        
                    >   
                        {link.name}
                    </a>
                    ))}
                </nav>

                {/* Input: se expande desde la izquierda, sin tocar el botón */}
                <div
                    className={`absolute inset-y-0 left-0 flex items-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isSearchOpen ? "right-11 opacity-100" : "right-full opacity-0 pointer-events-none"
                    }`}
                >
                    <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="¿Que estas buscando hoy?"
                    className="w-full bg-transparent pl-7 pr-4  text-sm text-white placeholder-white/50 focus:outline-none"
                    
                    />
                </div>

                {/* Botón único: ya no se monta con los links, siempre en el mismo lugar */}
                <button
                    onClick={() => setIsSearchOpen((v) => !v)}
                    className="relative z-10 flex items-center justify-center h-8 w-8 mr-3 rounded-full hover:bg-white/10 text-white shrink-0"
                    aria-label={isSearchOpen ? "Cerrar búsqueda" : "Buscar"}
                >
                    {isSearchOpen ? <X size={17} /> : <Search size={17} />}
                </button>
                </div>
 
          {/* Acciones a la derecha */}
          <div className="flex items-center gap-2.5">
 
            {/* Carrito: contorno neon verde/rosa, siempre difuminado, colores en esquinas opuestas */}
            <div className="relative shrink-0">
              
              <a
              href="/Checkout"
              className="relative flex h-9 items-center gap-2 rounded-full bg-black/55 px-3.5 text-sm font-medium text-white backdrop-blur-md sm:px-4"
            >
              {/* Conducto / borde eléctrico */}
              <span className="pointer-events-none absolute -inset-[0.1px] overflow-hidden rounded-full">
                <span className="absolute inset-[-120%] animate-[spin_3.2s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_118deg,#00FF37_135deg,#00FF37_148deg,transparent_165deg,transparent_278deg,#FF137A_295deg,#FF137A_308deg,transparent_325deg)]" />
              </span>

              {/* Capa interior: deja visible únicamente el borde */}
              <span className="pointer-events-none absolute inset-[2px] rounded-full bg-black/90" />

              {/* Halo exterior sutil */}
              <span className="pointer-events-none absolute -inset-[3px] -z-10 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_118deg,rgba(0,255,55,.6)_135deg,rgba(0,255,55,.6)_148deg,transparent_165deg,transparent_278deg,rgba(255,19,122,.6)_295deg,rgba(255,19,122,.6)_308deg,transparent_325deg)] blur-md animate-[spin_3.2s_linear_infinite]" />

              <ShoppingCart size={16} className="relative z-10" />
              <span className="relative z-10 hidden sm:inline">Carrito</span>
            </a>
            </div>
 
            {/* Búsqueda en móvil */}
            <button
              onClick={() => setIsMenuOpen(false) || setIsSearchOpen((v) => !v)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-full bg-white/10 text-white"
              aria-label="Buscar"
            >
              <Search size={17} />
            </button>
 
            {/* Usuario: reemplaza login/register, incluye dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setIsProfileMenuOpen((v) => !v)}
                className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/40 text-white transition-colors"
                aria-label="Cuenta"
              >
                <User size={17} />
              </button>
 
              <div
                className={`absolute right-0 mt-2 w-52 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden origin-top-right transition-all duration-200 ${
                  isProfileMenuOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                {isAuthenticated ? (
                  <div className="py-1">
                    <a
                      href="/userprofile"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/85 hover:bg-white/10"
                    >
                      <User size={15} /> Mi perfil
                    </a>
                    {userRole === "admin" && (
                      <a
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/85 hover:bg-white/10"
                      >
                        <Settings size={15} /> Dashboard
                      </a>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 text-left"
                    >
                      <LogOut size={15} /> Cerrar sesión
                    </button>
                  </div>
                ) : (
                  <div className="py-1">
                    <a
                      href="/login"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/85 hover:bg-white/10"
                    >
                      <LogIn size={15} /> Iniciar sesión
                    </a>
                    <a
                      href="/register"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/85 hover:bg-white/10"
                    >
                      <UserPlus size={15} /> Registrarse
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Buscador móvil: aparece debajo del header */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isSearchOpen ? "max-h-16 border-t border-white/10" : "max-h-0"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 bg-black/40 backdrop-blur-lg">
          <Search size={16} className="text-white/60 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="¿Que estas buscando hoy?"
            className="w-full bg-transparent text-sm text-white placeholder-white/50 focus:outline-none"
          />
        </div>
      </div>
 
      {/* Menú móvil: links de navegación */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMenuOpen ? "max-h-64 border-t border-white/10" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col px-4 py-3 gap-1 bg-black/40 backdrop-blur-lg">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm text-white/85 hover:bg-white/10"
            >
              {link.name}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
                                       