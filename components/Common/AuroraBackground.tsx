import React from 'react';

export const AuroraBackground: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-primary-100/20 rounded-full blur-[120px] animate-pulse"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-100/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
    <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-indigo-100/10 rounded-full blur-[80px] animate-pulse delay-1000"></div>
  </div>
);
