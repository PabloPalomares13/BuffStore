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
  Heart,
} from "lucide-react";
import logo from "../assets/BLogo4K-white.png";
import axios from "axios";
 
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
  const mobileSearchButtonRef = useRef(null);
  const mobileSearchPanelRef = useRef(null);


  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const link = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000';  

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
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }

      const isDesktopScreen = window.innerWidth >= 768; // breakpoint 'md' de Tailwind
      if (isDesktopScreen) {
        if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
          setIsSearchOpen(false);
          setShowResults(false);
        }
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
    useEffect(() => {
    // Si el input está vacío, no buscamos y limpiamos resultados
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    
    const timeoutId = setTimeout(async () => {
      try {
        const res = await axios.get(
          `${link}/api/products/search`,
          { params: { q: searchQuery } }
        );
        console.log("RESPUESTA BACKEND:", res.data);
        setSearchResults(res.data.products || res.data); // ajusta según lo que devuelva tu endpoint
        setShowResults(true);
      } catch (error) {
        console.error("Error buscando productos:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms de espera prudente antes de disparar la búsqueda

    // Si el usuario sigue escribiendo, cancelamos la búsqueda anterior
    return () => clearTimeout(timeoutId);
      }, [searchQuery]);
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
    { name: "Contactanos", href: "/contactsection" },
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
            ? "bg-black/70 shadow-md backdrop-blur-sm"
            : "bg-black/90 backdrop-blur-lg shadow-lg"
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

        <div
          ref={searchWrapRef}
          className="hidden md:flex relative items-center mx-8 w-[34rem]"
        >
        <div
          className="flex relative items-center h-13 w-full rounded-full bg-white/10 backdrop-blur-md border border-white/10 overflow-hidden"
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
                className="text-md text-white/90 hover:text-white/40 transition-colors"
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
              className="w-full bg-transparent pl-7 pr-4 text-sm text-white placeholder-white/50 focus:outline-none"
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

          {/* Dropdown de resultados de búsqueda */}
          {isSearchOpen && showResults && (
            <div className="absolute top-full left-0 mt-2 w-[34rem] rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 overflow-hidden shadow-lg z-20">
              {isSearching ? (
                <div className="px-5 py-4 text-sm text-white/60">Buscando...</div>
              ) : searchResults.length > 0 ? (
                <ul className="max-h-80 overflow-y-auto divide-y divide-white/10">
                  {searchResults.map((product) => (
                    <li key={product._id}>
                      <a
                        href={`/product/${product._id}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-white/10 transition-colors"
                      >
                        {product.media?.[0]?.url && (
                          <img
                            src={product.media[0].url}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{product.name}</p>
                          <p className="text-xs text-white/50">${product.price}</p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-4 text-sm text-white/60">
                  No se encontraron resultados para "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
                
                
 
          {/* Acciones a la derecha */}
          <div className="flex items-center gap-2.5">
            
            {/* Favoritos: contorno neon verde/rosa, siempre difuminado, colores en esquinas opuestas */}
            <div className="relative shrink-0">
              <a
              href="/favorites"
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

              <Heart size={16} className="relative z-10" />
            </a>
            </div>
            
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
              ref={mobileSearchButtonRef}
              onClick={() => setIsMenuOpen(false) || setIsSearchOpen((v) => !v)}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-full bg-white/10 text-white"
              aria-label={isSearchOpen ? "Cerrar búsqueda" : "Buscar"}
            >
              {isSearchOpen ? <X size={17} /> : <Search size={17} />}
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
        ref={mobileSearchPanelRef}
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isSearchOpen ? "max-h-[28rem] border-t border-white/10" : "max-h-0"
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

        {showResults && (
          <div className="bg-black/40 backdrop-blur-lg border-t border-white/10">
            {isSearching ? (
              <div className="px-5 py-4 text-sm text-white/60">Buscando...</div>
            ) : searchResults.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto divide-y divide-white/10">
                {searchResults.map((product) => (
                  <li key={product._id}>
                    <a
                      href={`/product/${product._id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-white/10 transition-colors"
                    >
                      {product.media?.[0]?.url && (
                        <img
                          src={product.media[0].url}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{product.name}</p>
                        <p className="text-xs text-white/50">${product.price}</p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-4 text-sm text-white/60">
                No se encontraron resultados para "{searchQuery}"
              </div>
            )}
          </div>
        )}
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