import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Phone, Calendar, MoreHorizontal, X, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, DynamicAvatar } from './Common';

interface Appointment {
  id: string;
  clientName: string;
  clientAvatar?: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  price: number;
  notes?: string;
}

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500';
      case 'pending': return 'bg-amber-500';
      case 'completed': return 'bg-nature-400';
      case 'cancelled': return 'bg-rose-500';
      default: return 'bg-nature-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendente';
      case 'completed': return 'Realizada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  // Mock appointments for week view
  const mockAppointments: Record<string, Appointment[]> = {
    '09:00': [
      { id: '1', clientName: 'Ana Clara', service: 'Yoga Individual', date: weekDays[1].toDateString(), time: '09:00', duration: 60, status: 'confirmed', price: 150 },
    ],
    '10:00': [
      { id: '2', clientName: 'João Paulo', service: 'Meditação Guiada', date: weekDays[2].toDateString(), time: '10:00', duration: 45, status: 'pending', price: 100 },
    ],
    '14:00': [
      { id: '3', clientName: 'Maria Flor', service: 'Terapia Holística', date: weekDays[3].toDateString(), time: '14:00', duration: 90, status: 'confirmed', price: 200 },
    ],
    '16:00': [
      { id: '4', clientName: 'Carlos Luz', service: 'Reiki', date: weekDays[4].toDateString(), time: '16:00', duration: 60, status: 'confirmed', price: 180 },
    ],
  };

  return (
    <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col animate-in slide-in-from-right">
      {/* Header */}
      <header className="px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-4 bg-white border-b border-nature-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all">
              <ChevronLeft size={22} />
            </button>
            <div>
              <h2 className="text-xl font-serif italic text-nature-900">Agenda</h2>
              <p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </p>
            </div>
          </div>
          <button
            onClick={onAddAppointment}
            className="p-3 bg-primary-500 text-white rounded-2xl"
          >
            <Plus size={22} />
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex bg-nature-100 rounded-xl p-1 mb-4">
          {['day', 'week', 'month'].map(v => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                view === v ? 'bg-white text-nature-900 shadow-sm' : 'text-nature-500'
              }`}
            >
              {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigateWeek(-1)} className="p-2 text-nature-400">
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            {weekDays.map((day, i) => {
              const isToday = day.toDateString() === today;
              return (
                <div
                  key={i}
                  className={`w-10 text-center py-2 rounded-xl transition-all ${
                    isToday ? 'bg-primary-500 text-white' : 'text-nature-600'
                  }`}
                >
                  <p className="text-[10px] font-bold">{days[day.getDay()]}</p>
                  <p className="text-lg font-bold">{day.getDate()}</p>
                </div>
              );
            })}
          </div>
          
          <button onClick={() => navigateWeek(1)} className="p-2 text-nature-400">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex min-h-full">
          {/* Time column */}
          <div className="w-16 flex-shrink-0 border-r border-nature-100 bg-white">
            {timeSlots.map(time => (
              <div key={time} className="h-20 px-2 py-1 text-right text-xs text-nature-400 border-b border-nature-50">
                {time}
              </div>
            ))}
          </div>

          {/* Days columns */}
          <div className="flex-1 flex">
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="flex-1 border-r border-nature-100 last:border-r-0">
                {timeSlots.map(time => {
                  const apt = mockAppointments[time]?.find(a => a.date === day.toDateString());
                  return (
                    <div 
                      key={time} 
                      className="h-20 border-b border-nature-50 p-1"
                    >
                      {apt && (
                        <button
                          onClick={() => setSelectedAppointment(apt)}
                          className={`w-full h-full ${getStatusColor(apt.status)} text-white text-xs p-2 rounded-lg text-left overflow-hidden active:scale-[0.98] transition-all`}
                        >
                          <p className="font-bold truncate">{apt.clientName}</p>
                          <p className="truncate opacity-80">{apt.service}</p>
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
      <div className="flex gap-4 px-6 py-4 bg-white border-t border-nature-100">
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-nature-900">12</p>
          <p className="text-[10px] text-nature-400 uppercase">Esta Semana</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-emerald-600">10</p>
          <p className="text-[10px] text-nature-400 uppercase">Confirmadas</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-amber-600">2</p>
          <p className="text-[10px] text-nature-400 uppercase">Pendentes</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-primary-600">68%</p>
          <p className="text-[10px] text-nature-400 uppercase">Ocupação</p>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-[300] flex items-end animate-in fade-in">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedAppointment(null)} />
          <div className="relative w-full bg-white rounded-t-[2rem] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom">
            <div className="w-12 h-1 bg-nature-200 rounded-full mx-auto mb-6" />
            
            <div className="flex items-start gap-4 mb-6">
              <DynamicAvatar user={{ name: selectedAppointment.clientName }} size="lg" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-nature-900">{selectedAppointment.clientName}</h3>
                <p className="text-nature-500">{selectedAppointment.service}</p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold mt-2 ${
                  selectedAppointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                  selectedAppointment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-nature-100 text-nature-600'
                }`}>
                  {getStatusLabel(selectedAppointment.status)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-4">
                <Calendar size={18} className="text-primary-500 mb-2" />
                <p className="text-[10px] text-nature-400 uppercase">Data</p>
                <p className="font-bold text-nature-900">{new Date(selectedAppointment.date).toLocaleDateString('pt-BR')}</p>
              </Card>
              <Card className="p-4">
                <Clock size={18} className="text-primary-500 mb-2" />
                <p className="text-[10px] text-nature-400 uppercase">Horário</p>
                <p className="font-bold text-nature-900">{selectedAppointment.time}</p>
              </Card>
            </div>

            <div className="flex gap-3">
              {selectedAppointment.status === 'pending' && (
                <button 
                  onClick={() => { onConfirm(selectedAppointment.id); setSelectedAppointment(null); }}
                  className="flex-1 py-4 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  Confirmar
                </button>
              )}
              <button 
                onClick={() => { onReschedule(selectedAppointment.id); setSelectedAppointment(null); }}
                className="flex-1 py-4 bg-nature-100 text-nature-600 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Reagendar
              </button>
              <button 
                onClick={() => { onCancel(selectedAppointment.id); setSelectedAppointment(null); }}
                className="py-4 px-4 bg-rose-50 text-rose-500 rounded-xl font-bold"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveCalendar;
