
import { useState, useEffect } from "react";
import { User, Settings, LogOut } from "lucide-react";
import logo from '../assets/logobuff0033.png'

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('userToken');
        const role = localStorage.getItem('userRole');

        setIsAuthenticated(!!token);
        if (role) setUserRole(role);


        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(!isProfileMenuOpen);
    };

    const handleLogout = () => {
        
        localStorage.removeItem('userToken');
        localStorage.removeItem('userRole');
        setIsAuthenticated(false);
       
        window.location.href = '/login';
    };

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-600 ${
                isScrolled
                    ? "bg-white/6 shadow-md backdrop-blur-sm"
                    : "bg-white/2 backdrop-blur-lg shadow-lg"
            }`}
        >
            <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-18 items-center justify-between">
                    <div className="md:flex md:items-center md:gap-12">
                        <a href="/home">
                            <img
                                src={logo}
                                alt="logo"
                                className="w-42 rounded-2xl px-1 py-1 bg-opacity-80"
                            />
                        </a>
                    </div>

                    <div className="hidden md:block">
                        <nav aria-label="Global">
                            <ul className="flex items-center gap-6 text-sm">
                                <li>
                                    <a
                                        className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                                        href="/Dashboard"
                                    >
                                        Nosotros
                                    </a>
                                </li>


                                <li>
                                    <a
                                        className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                                        href="#"
                                    >
                                        Historia
                                    </a>
                                </li>

                                <li>
                                    <a
                                        className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                                        href="#"
                                    >
                                        Servicios
                                    </a>
                                </li>

                                <li>
                                    <a
                                        className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                                        href="#"
                                    >
                                        Comunidad
                                    </a>
                                </li>

                                <li>
                                    <a
                                        className="text-gray-500 transition hover:text-gray-500/75 dark:text-white dark:hover:text-white/75"
                                        href="#"
                                    >
                                        Blog
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={toggleProfileMenu}
                                    className="flex items-center focus:outline-none"
                                >
                                    <div className="w-10 h-10 relative overflow-hidden rounded-full bg-gradient-to-r from-blue-400 to-pink-400 p-0.5">
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
                                            className="flex items-center px-4 py-2 text-sm text-gray-400 hover:bg-white/50 transition-colors"
                                        >
                                            <span className="mr-2"><User size={16} /></span>
                                            Mi Carrito
                                        </a>
                                        <a
                                            href="/userprofile"
                                            className="flex items-center px-4 py-2 text-sm text-gray-400 hover:bg-white/50 transition-colors"
                                        >
                                            <span className="mr-2"><User size={16} /></span>
                                            Mi perfil
                                        </a>
                                        {userRole === 'admin' && (
                                            <a
                                                href="/dashboard"
                                                className="flex items-center px-4 py-2 text-sm text-gray-400 hover:bg-white/50 transition-colors"
                                            >
                                                <span className="mr-2"><Settings size={16} /></span>
                                                Dashboard
                                            </a>
                                        )}
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
                        ) : (
                            <div className="sm:flex hidden sm:gap-4">
                                <a
                                            href="/Checkout"
                                            className="flex items-center px-4 py-2 text-sm text-gray-400 hover:bg-white/50 transition-colors bg-white/70 rounded-md"
                                        >
                                            <span className="mr-2"><User size={16} /></span>
                                            Mi Carrito
                                        </a>
                                <a
                                    className="rounded-md bg-gradient-to-r from-teal-500 to-teal-700 px-5 py-2.5 text-sm font-medium text-white shadow hover:from-teal-600 hover:to-teal-700"
                                    href="/login"
                                >
                                    Login
                                </a>

                                <div className="hidden sm:flex">
                                    <a
                                        className="rounded-md bg-gradient-to-r from-purple-600 to-purple-800 px-5 py-2.5 text-sm font-medium text-white hover:from-purple-700 hover:to-purple-900"
                                        href="/register"
                                    >
                                        Register
                                    </a>
                                </div>
                                
                            </div>
                        )}

                        <div className="md:hidden">
                            <button
                                onClick={toggleMenu}
                                className="rounded-md bg-gray-800 p-2 text-gray-200 transition hover:text-teal-400"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="size-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                        
                        {isMenuOpen && (
                            <div className="md:hidden lg:hidden">
                                <nav className="mt-9.25 space-y-2 pb-6 absolute right-3 bg-white/80 p-10 rounded-lg flex flex-col text-center">
                                    <a
                                        className="rounded-lg hover:bg-white/40 text-sm font-medium text-gray-800 px-4 py-2 transition-all duration-600 ease-in-out"
                                        href="/Dashboard"
                                    >
                                        Nosotros
                                    </a>
                                    <a
                                        className="rounded-lg hover:bg-white/40 text-sm font-medium text-gray-800 px-4 py-2 transition-all duration-600 ease-in-out"
                                        href="#"
                                    >
                                        Historia
                                    </a>
                                    <a
                                        className="rounded-lg hover:bg-white/40 text-sm font-medium text-gray-800 px-4 py-2 transition-all duration-600 ease-in-out"
                                        href="#"
                                    >
                                        Servicios
                                    </a>
                                    <a
                                        className="rounded-lg hover:bg-white/40 text-sm font-medium text-gray-800 px-4 py-2 transition-all duration-600 ease-in-out"
                                        href="#"
                                    >
                                        Comunidad
                                    </a>
                                    <a
                                        className="rounded-lg hover:bg-white/40 text-sm font-medium text-gray-800 px-4 py-2 transition-all duration-600 ease-in-out"
                                        href="#"
                                    >
                                        Blog
                                    </a>
                                    
                                    {isAuthenticated ? (
                                        <div className="mt-5 space-y-3">
                                            <a
                                                className="rounded-lg hover:bg-white/40 text-sm font-medium text-gray-400 px-4 py-2 transition-all duration-600 ease-in-out"
                                                href="/checkout"
                                            >
                                                Mi carrito
                                            </a>
                                            {userRole === 'admin' && (
                                                <a
                                                    className="rounded-lg hover:bg-white/40 text-sm font-medium text-gray-400 px-4 py-2 transition-all duration-600 ease-in-out"
                                                    href="/dashboard"
                                                >
                                                    Dashboard
                                                </a>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full rounded-lg hover:bg-white/40 text-sm font-medium text-red-400 px-4 py-2 transition-all duration-600 ease-in-out"
                                            >
                                                Cerrar sesión
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-5 space-y-3">
                                            <a
                                                className="min-sm:hidden mr-1 rounded-md bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-2.5 text-center text-sm font-medium text-white shadow hover:from-teal-600 hover:to-teal-700 transition-all duration-600 ease-in-out"
                                                href="/login"
                                            >
                                                Login
                                            </a>
                                            
                                            <a
                                                className="min-sm:hidden ml-1 rounded-md bg-gradient-to-r from-purple-600 to-purple-800 px-5 py-2.5 text-center text-sm font-medium text-white hover:from-purple-700 hover:to-purple-900 transition-all duration-600 ease-in-out"
                                                href="/register"
                                            >
                                                Register
                                            </a>
                                            <a
                                            href="/Checkout"
                                            className="flex items-center px-4 text-sm text-gray-700 hover:bg-white/50 transition-colors bg-white/70 rounded-md mt-6 py-3"
                                        >
                                            <span className="mr-2"><User size={16} /></span>
                                            Mi Carrito
                                        </a>
                                        </div>
                                    )}
                                </nav>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
                                       