import React from 'react';
import { Calendar } from 'lucide-react';

export const CalendarWidget: React.FC = () => (
  <div className="bg-white p-8 rounded-[3rem] border border-nature-100 shadow-sm text-center">
    <Calendar size={40} className="mx-auto text-primary-500 mb-4" />
    <h4 className="font-serif italic text-lg text-nature-900">Agenda Holística</h4>
    <p className="text-xs text-nature-400 mt-2">Sincronize com os ritmos cósmicos.</p>
  </div>
);
