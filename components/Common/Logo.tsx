import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' | 'splash', className?: string, animated?: boolean }> = ({ size = 'md', className = "", animated = false }) => {
  const [error, setError] = useState(false);
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    splash: 'w-40 h-40'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`}>
      {animated && (
        <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-3xl animate-breathe"></div>
      )}
      {!error ? (
        <img 
          src="/logo.png" 
          alt="Viva360 Logo" 
          crossOrigin="anonymous"
          onError={() => setError(true)}
          className={`w-full h-full object-contain relative z-10 ${animated ? 'animate-breathe' : ''}`}
        />
      ) : (
        <div className="bg-nature-900 rounded-full w-full h-full flex items-center justify-center opacity-20">
            <Sparkles size={size === 'sm' ? 12 : 24} className="text-white" />
        </div>
      )}
    </div>
  );
};
