import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Check } from 'lucide-react';
import { Professional } from '../types';

interface SchedulingModalProps {
  professional: Professional;
  serviceName: string;
  onClose: () => void;
  onConfirm: (date: Date, time: string) => void;
}

export const SchedulingModal: React.FC<SchedulingModalProps> = ({
  professional,
  serviceName,
  onClose,
  onConfirm,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Generate next 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const handleConfirm = () => {
    if (selectedTime) {
      onConfirm(selectedDate, selectedTime);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-nature-900/60 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative w-full sm:w-[500px] bg-nature-50 rounded-t-[3rem] sm:rounded-[3rem] p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[90vh]">
        <div className="w-12 h-1.5 bg-nature-200 rounded-full mx-auto mb-8 opacity-50 flex-none sm:hidden" />
        
        <div className="flex justify-between items-start mb-6 flex-none">
          <div>
            <h2 className="text-2xl font-serif italic font-medium text-nature-900">Agendar Sessão</h2>
            <p className="text-xs text-nature-500 font-bold uppercase tracking-widest mt-1">{serviceName}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-nature-500 hover:bg-nature-100 transition-colors shadow-sm border border-nature-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
            {/* Calendar Strip */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-nature-900">{monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</span>
                    <div className="flex gap-2">
                         <button className="p-1 text-nature-400 hover:text-nature-600"><ChevronLeft size={18}/></button>
                         <button className="p-1 text-nature-400 hover:text-nature-600"><ChevronRight size={18}/></button>
                    </div>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 px-2 no-scrollbar snap-x">
                    {days.map((day, i) => {
                        const isSelected = day.toDateString() === selectedDate.toDateString();
                        return (
                            <button
                                key={i}
                                onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                                className={`flex-none w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all snap-start border ${
                                    isSelected 
                                    ? 'bg-nature-900 text-white border-nature-900 shadow-lg shadow-nature-900/20 scale-105' 
                                    : 'bg-white text-nature-400 border-nature-100 hover:border-primary-200 hover:bg-white/80'
                                }`}
                            >
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{weekDayNames[day.getDay()]}</span>
                                <span className="text-xl font-serif italic font-medium">{day.getDate()}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Time Slots */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest px-2 flex items-center gap-2"><Clock size={12} className="text-primary-500"/> Horários Disponíveis</h4>
                <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map(time => {
                        const isSelected = selectedTime === time;
                        return (
                            <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                                    isSelected
                                    ? 'bg-primary-500 text-white border-primary-500 shadow-md scale-105'
                                    : 'bg-white text-nature-600 border-nature-100 hover:border-primary-200 hover:bg-primary-50'
                                }`}
                            >
                                {time}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Summary Card */}
            {selectedTime && (
                <div className="bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white/60 shadow-lg shadow-nature-900/5 flex items-center justify-between animate-in slide-in-from-bottom-4 fade-in">
                    <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                            <CalendarIcon size={24} />
                         </div>
                         <div>
                             <p className="text-xs text-nature-500 font-bold uppercase tracking-wider">Agendamento</p>
                             <p className="text-nature-900 font-medium">
                                 {weekDayNames[selectedDate.getDay()]}, {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]} • {selectedTime}
                             </p>
                         </div>
                    </div>
                </div>
            )}
        </div>

        <div className="mt-8 flex-none pt-4 border-t border-nature-200">
            <button
                disabled={!selectedTime}
                onClick={handleConfirm}
                className="w-full bg-nature-900 text-white py-5 rounded-[2rem] font-bold uppercase tracking-widest text-xs shadow-xl shadow-nature-900/20 active:scale-95 transition-all hover:bg-nature-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
                <Check size={18} />
                Confirmar Agendamento
            </button>
        </div>
      </div>
    </div>
  );
};
