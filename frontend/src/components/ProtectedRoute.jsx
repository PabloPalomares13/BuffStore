import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const savedRole = localStorage.getItem("userRole");

    if (savedRole) setUserRole(savedRole);

    if (token) {
      const fetchProfile = async () => {
        try {
          const backendURL = import.meta.env.PROD
            ? import.meta.env.VITE_BACKEND_URL
            : "http://localhost:3000";

          const response = await fetch(`${backendURL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            setIsAuthenticated(true);
            setUserRole(data.role);
            localStorage.setItem("userRole", data.role);
          } else {
            console.warn("Token inválido o expirado.");
            setIsAuthenticated(false);
            localStorage.removeItem("userToken");
            localStorage.removeItem("userRole");
          }
        } catch (error) {
          console.error("Error validating token:", error);
          setIsAuthenticated(false);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfile();
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🧠 Aquí es donde se permite más de un rol
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;