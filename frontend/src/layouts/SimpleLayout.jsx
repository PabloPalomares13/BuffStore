import React from 'react';
import { Outlet } from 'react-router-dom';


function SimpleLayout() {
  return (
    <main>
      <Outlet /> {/* Este Outlet renderiza el contenido de cada página */}
    </main>
  );
}

export default SimpleLayout;