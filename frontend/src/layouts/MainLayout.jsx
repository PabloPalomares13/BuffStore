import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import background from '../assets/bg-img001.jpg'
import { Outlet } from 'react-router-dom';


function MainLayout () {
  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${background})` }}>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;