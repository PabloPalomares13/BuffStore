const DashboardCard = ({ title, action, children, className = "" }) => {
  return (
    <div
      className={`bg-black/40 backdrop-blur-md rounded-[20px] p-5 transition-colors hover:bg-black/20 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && (
            <h3 className="font-haze text-lg uppercase tracking-wide text-white">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      <div className="font-Urbanist text-white/70">
        {children || (
          <div className="h-40 flex items-center justify-center">
            <p className="text-white/40">Contenido del panel</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;