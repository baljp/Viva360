import React, { useState } from 'react';
import { User as UserType } from '../../types';

export const DynamicAvatar: React.FC<{ user: Partial<UserType>, size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }> = ({ user, size = 'md', className = "" }) => {
  const [imgError, setImgError] = useState(false);
  const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-20 h-20', xl: 'w-32 h-32' };
  
  return (
    <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden border-2 border-white shadow-sm bg-nature-100 flex-none relative flex items-center justify-center`}>
      {!imgError ? (
          <img 
            src={user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name || 'user'}`} 
            loading="lazy" 
            crossOrigin="anonymous"
            className="w-full h-full object-cover" 
            alt={user.name} 
            onError={() => setImgError(true)}
          />
      ) : (
          <div className="w-full h-full bg-nature-200 flex items-center justify-center text-nature-400">
             <span className="font-serif italic font-bold text-lg">{user.name?.charAt(0) || 'U'}</span>
          </div>
      )}
    </div>
  );
};
