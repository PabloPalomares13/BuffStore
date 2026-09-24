import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating, size = 12, showValue = true }) => {
  const hasRating = rating != null && rating !== '' && !Number.isNaN(Number(rating));
  const value = hasRating ? Math.min(5, Math.max(0, Number(rating))) : 0;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex gap-0.5"
        role="img"
        aria-label={hasRating ? `Calificación ${value.toFixed(1)} de 5` : 'Sin calificación'}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          // Porcentaje de esta estrella que se rellena (0 a 100)
          const fillPercent = Math.min(1, Math.max(0, value - i)) * 100;

          return (
            <span
              key={i}
              className="relative inline-block shrink-0"
              style={{ width: size, height: size }}
            >
              <Star size={size} className="absolute inset-0 fill-white/20 text-white/20" />
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fillPercent}%` }}
              >
                <Star size={size} className="block max-w-none shrink-0 fill-white text-white" />
              </span>
            </span>
          );
        })}
      </div>

      {showValue && hasRating && (
        <span className="font-Urbanist text-xs text-white/70">{value.toFixed(1)}/5</span>
      )}
    </div>
  );
};

export default StarRating;