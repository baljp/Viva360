import React from 'react';

export const SettingsToggle: React.FC<{ active: boolean; onToggle: () => void }> = ({ active, onToggle }) => (
  <button onClick={onToggle} className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-primary-600' : 'bg-nature-200'}`}>
    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-7' : 'left-1'}`} />
  </button>
);

