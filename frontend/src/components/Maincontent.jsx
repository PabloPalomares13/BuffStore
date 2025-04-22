
import React from 'react';

const MainContent = ({ children }) => {
  return (
    <main className="flex-1 overflow-y-auto p-6 bg-transparent">
      {children}
    </main>
  );
};

export default MainContent;