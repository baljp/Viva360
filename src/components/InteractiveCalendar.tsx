import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Phone, Calendar, MoreHorizontal, X, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, DynamicAvatar } from './Common';

import { Appointment } from '../types';

interface InteractiveCalendarProps {
  appointments: Appointment[];
  onClose: () => void;
  onAddAppointment: () => void;
  onReschedule: (id: string) => void;
  onCancel: (id: string) => void;
  onConfirm: (id: string) => void;
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  appointments,
  onClose,
  onAddAppointment,
  onReschedule,
  onCancel,
  onConfirm,
}) => {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Generate week days
  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      return day;
    });
  };

  // Generate time slots
  const timeSlots = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

  const weekDays = getWeekDays();
  const today = new Date().toDateString();

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const getStatusColor = (type: string, status: string) => {
    if (type === 'swap') return 'bg-purple-500 shadow-lg shadow-purple-500/20'; // Alquimia
    if (type === 'voucher') return 'bg-orange-500 shadow-lg shadow-orange-500/20'; // Evento
    
    switch (status) {
      case 'confirmed': return 'bg-emerald-500 shadow-lg shadow-emerald-500/20';
      case 'pending': return 'bg-amber-500 shadow-lg shadow-amber-500/20';
      case 'completed': return 'bg-nature-400';
      case 'cancelled': return 'bg-rose-500';
      default: return 'bg-nature-300';
    }
  };

  const getStatusLabel = (type: string, status: string) => {
    if (type === 'swap') return 'Escambo';
    if (type === 'voucher') return 'Evento';

    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendente';
      case 'completed': return 'Realizada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const mockAppointments: Record<string, Appointment[]> = {
    '09:00': [
      { id: '1', clientName: 'Ana Clara', serviceName: 'Yoga Individual', date: weekDays[1].toDateString(), time: '09:00', duration: 60, status: 'confirmed', price: 150, clientId: 'c1', professionalId: 'p1', professionalName: 'Prof', type: 'paid' },
    ],
    '10:00': [
      { id: '2', clientName: 'João Paulo', serviceName: 'Meditação Guiada', date: weekDays[2].toDateString(), time: '10:00', duration: 45, status: 'pending', price: 100, clientId: 'c2', professionalId: 'p1', professionalName: 'Prof', type: 'paid' },
    ],
    '14:00': [
      { id: 'swap1', clientName: 'Sara Conexões', serviceName: 'Troca: Constelação x Reiki', date: weekDays[3].toDateString(), time: '14:00', duration: 90, status: 'confirmed', price: 0, clientId: 'p2', professionalId: 'p1', professionalName: 'Prof', type: 'swap' },
    ],
    '16:00': [
      { id: 'evt1', clientName: 'Círculo de Mulheres', serviceName: 'Santuário Luna', date: weekDays[4].toDateString(), time: '16:00', duration: 120, status: 'confirmed', price: 50, clientId: 'c4', professionalId: 'p1', professionalName: 'Prof', type: 'voucher' },
    ],
  };

  return (
    <div className="fixed inset-0 z-[200] bg-nature-50/50 backdrop-blur-xl flex flex-col animate-in slide-in-from-right selection:bg-primary-500 selection:text-white">
      {/* Header */}
      <header className="px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-4 bg-white/80 backdrop-blur-md border-b border-white/40 shadow-sm z-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-3 bg-nature-50 rounded-full text-nature-600 active:scale-95 transition-all shadow-sm hover:bg-nature-100">
              <ChevronLeft size={22} />
            </button>
            <div>
              <h2 className="text-xl font-serif italic text-nature-900 font-medium">Sua Agenda</h2>
              <p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </p>
            </div>
          </div>
          <button
            onClick={onAddAppointment}
            className="p-3 bg-nature-900 text-white rounded-full shadow-lg shadow-nature-900/20 active:scale-95 transition-all hover:bg-nature-800"
          >
            <Plus size={22} />
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex bg-white/50 backdrop-blur-sm rounded-2xl p-1.5 mb-6 border border-white/40">
          {['day', 'week', 'month'].map(v => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                view === v ? 'bg-white text-nature-900 shadow-md' : 'text-nature-400 hover:text-nature-600'
              }`}
            >
              {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigateWeek(-1)} className="p-2 text-nature-400 hover:text-nature-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            {weekDays.map((day, i) => {
              const isToday = day.toDateString() === today;
              return (
                <div
                  key={i}
                  className={`min-w-[3rem] text-center py-3 rounded-2xl transition-all border ${
                    isToday 
                      ? 'bg-nature-900 text-white border-nature-900 shadow-lg shadow-nature-900/20' 
                      : 'bg-white/40 border-white/40 text-nature-400 hover:bg-white/80'
                  }`}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wide opacity-80">{days[day.getDay()]}</p>
                  <p className="text-lg font-serif italic font-medium">{day.getDate()}</p>
                </div>
              );
            })}
          </div>
          
          <button onClick={() => navigateWeek(1)} className="p-2 text-nature-400 hover:text-nature-600 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex min-h-full">
          {/* Time column */}
          <div className="w-16 flex-shrink-0 border-r border-nature-100/50 bg-white/30 backdrop-blur-sm pt-4">
            {timeSlots.map(time => (
              <div key={time} className="h-24 px-2 py-1 text-right text-[10px] font-bold text-nature-300 border-b border-nature-50/50 relative">
                <span className="relative -top-3">{time}</span>
              </div>
            ))}
          </div>

          {/* Days columns */}
          <div className="flex-1 flex pt-4">
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="flex-1 border-r border-nature-100/50 last:border-r-0 relative group">
                {/* Day background hover effect */}
                <div className="absolute inset-0 bg-primary-50/0 group-hover:bg-primary-50/30 transition-colors pointer-events-none"></div>
                
                {timeSlots.map(time => {
                  const apt = mockAppointments[time]?.find(a => a.date === day.toDateString());
                  return (
                    <div 
                      key={time} 
                      className="h-24 border-b border-nature-50/50 p-1 relative"
                    >
                      {apt && (
                        <button
                          onClick={() => setSelectedAppointment(apt)}
                          className={`w-full h-full ${getStatusColor(apt.type || 'paid', apt.status)} text-white p-2.5 rounded-2xl text-left overflow-hidden active:scale-[0.96] transition-all hover:brightness-110 shadow-lg z-10 relative`}
                        >
                          <p className="font-serif font-medium truncate text-sm">{apt.clientName}</p>
                          <p className="truncate text-[10px] font-medium uppercase tracking-wide opacity-90 mt-0.5">{apt.serviceName}</p>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 px-6 py-6 bg-white/80 backdrop-blur-md border-t border-white/40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="flex-1 text-center">
          <p className="text-2xl font-serif italic text-nature-900">12</p>
          <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Esta Semana</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-2xl font-serif italic text-emerald-600">10</p>
          <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Confirmadas</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-2xl font-serif italic text-amber-600">2</p>
          <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Pendentes</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-2xl font-serif italic text-primary-600">68%</p>
          <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Ocupação</p>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-[300] flex items-end animate-in fade-in">
          <div className="absolute inset-0 bg-nature-900/60 backdrop-blur-md" onClick={() => setSelectedAppointment(null)} />
          <div className="relative w-full bg-nature-50 rounded-t-[3rem] p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom shadow-2xl">
            <div className="w-12 h-1.5 bg-nature-200 rounded-full mx-auto mb-8 opacity-50" />
            
            <div className="flex items-start gap-5 mb-8">
              <DynamicAvatar user={{ name: selectedAppointment.clientName }} size="lg" className="border-4 border-white shadow-xl" />
              <div className="flex-1">
                <h3 className="text-2xl font-serif italic font-medium text-nature-900 leading-tight">{selectedAppointment.clientName}</h3>
                <p className="text-nature-500 font-medium">{selectedAppointment.serviceName}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide mt-3 ${
                  selectedAppointment.type === 'swap' ? 'bg-purple-100 text-purple-700' :
                  selectedAppointment.type === 'voucher' ? 'bg-orange-100 text-orange-700' :
                  selectedAppointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                  selectedAppointment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-nature-100 text-nature-600'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                      selectedAppointment.type === 'swap' ? 'bg-purple-500' :
                      selectedAppointment.type === 'voucher' ? 'bg-orange-500' :
                      selectedAppointment.status === 'confirmed' ? 'bg-emerald-500' :
                      selectedAppointment.status === 'pending' ? 'bg-amber-500' :
                      'bg-nature-500'
                  }`}></div>
                  {getStatusLabel(selectedAppointment.type || 'paid', selectedAppointment.status)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <Card className="p-5 bg-white border-nature-100 shadow-sm">
                <Calendar size={20} className="text-primary-500 mb-3" />
                <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Data do Ritual</p>
                <p className="text-lg font-serif italic text-nature-900 mt-1">{new Date(selectedAppointment.date).toLocaleDateString('pt-BR')}</p>
              </Card>
              <Card className="p-5 bg-white border-nature-100 shadow-sm">
                <Clock size={20} className="text-primary-500 mb-3" />
                <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest">Horário</p>
                <p className="text-lg font-serif italic text-nature-900 mt-1">{selectedAppointment.time}</p>
              </Card>
            </div>

            <div className="flex gap-3">
              {selectedAppointment.status === 'pending' && (
                <button 
                  onClick={() => { onConfirm(selectedAppointment.id); setSelectedAppointment(null); }}
                  className="flex-1 py-5 bg-emerald-500 text-white rounded-[2rem] font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Check size={18} />
                  Confirmar
                </button>
              )}
              <button 
                onClick={() => { onReschedule(selectedAppointment.id); setSelectedAppointment(null); }}
                className="flex-1 py-5 bg-white text-nature-900 border border-nature-100 rounded-[2rem] font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-nature-50"
              >
                <RefreshCw size={18} />
                Reagendar
              </button>
              <button 
                onClick={() => { onCancel(selectedAppointment.id); setSelectedAppointment(null); }}
                className="py-5 px-6 bg-rose-50 text-rose-500 border border-rose-100 rounded-[2rem] font-bold active:scale-95 transition-all hover:bg-rose-100"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveCalendar;
