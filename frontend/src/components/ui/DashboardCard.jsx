
import React from 'react';

const DashboardCard = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-white/30 backdrop-blur-md rounded-xl shadow-lg border border-white/40 p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      <div className="text-gray-600">
        {children || (
          <div className="h-40 flex items-center justify-center">
            <p className="text-gray-400">Contenido del panel</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;