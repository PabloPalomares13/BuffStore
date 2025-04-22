import React, { useState, useEffect } from 'react';
import Superheader from '../components/Superheader';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/Maincontent';
import { Outlet } from 'react-router-dom';



const DashboardLayout = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Check for mobile view on mount and window resize
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    checkMobileView();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkMobileView);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-100 to-pink-100">
      {/* Sidebar Componente */}
      <Sidebar isOpen={isSidebarOpen} />

      {/*  area contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Componente */}
        <Superheader 
          isScrolled={isScrolled} 
          isMobileView={isMobileView} 
          isSidebarOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar} 
        />

        <MainContent>
          <Outlet />
        </MainContent>
      </div>

      {/* Backdrop for mobile sidebar */}
      {isMobileView && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default DashboardLayout;