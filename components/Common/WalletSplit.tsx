import React from 'react';

export const WalletSplit: React.FC<{ personal: number, corporate: number }> = ({ personal, corporate }) => (
  <div className="grid grid-cols-2 gap-4">
    <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm">
      <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-1">Pessoal</p>
      <h3 className="text-xl font-serif italic text-nature-900">R$ {personal.toFixed(2)}</h3>
    </div>
    <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm">
      <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-1">Corporativo</p>
      <h3 className="text-xl font-serif italic text-nature-900">R$ {corporate.toFixed(2)}</h3>
    </div>
  </div>
);
