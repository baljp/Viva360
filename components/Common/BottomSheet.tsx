import React from 'react';
import { X } from 'lucide-react';
import { ICON_SIZE } from './constants';

export const BottomSheet: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-nature-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-t-[1.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col">
        <div className="w-10 h-1 bg-nature-100 rounded-full mx-auto mb-6 flex-none"></div>
        <div className="flex justify-between items-center mb-6 flex-none">
          <h3 className="text-lg font-serif italic text-nature-900">{title}</h3>
          <button onClick={onClose} className="p-2 bg-nature-50 rounded-xl text-nature-300"><X size={ICON_SIZE.MD}/></button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
            {children}
        </div>
      </div>
    </div>
  );
};
