import React, { useState } from 'react';
import { ChevronLeft, Search, Filter, Users, Calendar, MessageCircle, FileText, MoreVertical, Heart, Gift, Clock, TrendingUp, Phone, ChevronRight, Star } from 'lucide-react';
import { Card, DynamicAvatar } from './Common';

interface Patient {
  id: string;
  name: string;
  avatar?: string;
  lastSession: string;
  totalSessions: number;
  nextAppointment?: string;
  status: 'active' | 'inactive' | 'new';
  notes?: string;
  phone?: string;
  tags: string[];
  progress: number; // 0-100
  birthday?: string;
}

interface PatientGardenProps {
  patients: Patient[];
  onClose: () => void;
  onViewPatient: (id: string) => void;
  onSendMessage: (id: string) => void;
  onSchedule: (id: string) => void;
  onViewRecords: (id: string) => void;
}

export const PatientGarden: React.FC<PatientGardenProps> = ({
  patients: initialPatients,
  onClose,
  onViewPatient,
  onSendMessage,
  onSchedule,
  onViewRecords,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'new'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Mock patients
  const mockPatients: Patient[] = [
    { id: '1', name: 'Ana Clara Silva', lastSession: '2024-01-18', totalSessions: 24, nextAppointment: '2024-01-25', status: 'active', tags: ['Yoga', 'Meditação'], progress: 75, phone: '11999887766', birthday: '03-15' },
    { id: '2', name: 'João Paulo Lima', lastSession: '2024-01-15', totalSessions: 12, status: 'active', tags: ['Terapia'], progress: 45, phone: '11988776655' },
    { id: '3', name: 'Maria Fernanda', lastSession: '2023-12-20', totalSessions: 8, status: 'inactive', tags: ['Reiki'], progress: 30 },
    { id: '4', name: 'Carlos Eduardo', lastSession: '2024-01-10', totalSessions: 3, status: 'new', tags: ['Yoga'], progress: 15 },
    { id: '5', name: 'Beatriz Santos', lastSession: '2024-01-20', totalSessions: 36, nextAppointment: '2024-01-27', status: 'active', tags: ['Meditação', 'Mindfulness'], progress: 90, birthday: '01-25' },
  ];

  const patients = mockPatients;

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'inactive': return 'bg-nature-100 text-nature-600';
      case 'new': return 'bg-primary-100 text-primary-700';
      default: return 'bg-nature-100 text-nature-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'new': return 'Novo';
      default: return status;
    }
  };

  // Check for upcoming birthdays
  const today = new Date();
  const upcomingBirthdays = patients.filter(p => {
    if (!p.birthday) return false;
    const [month, day] = p.birthday.split('-').map(Number);
    const bday = new Date(today.getFullYear(), month - 1, day);
    const diff = bday.getTime() - today.getTime();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // 7 days
  });

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
              <h2 className="text-xl font-serif italic text-nature-900">Jardim de Pacientes</h2>
              <p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">
                {patients.length} buscadores
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar paciente..."
            className="w-full bg-nature-50 pl-12 pr-4 py-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
          {[
            { id: 'all', label: 'Todos', count: patients.length },
            { id: 'active', label: 'Ativos', count: patients.filter(p => p.status === 'active').length },
            { id: 'inactive', label: 'Inativos', count: patients.filter(p => p.status === 'inactive').length },
            { id: 'new', label: 'Novos', count: patients.filter(p => p.status === 'new').length },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                filter === f.id
                  ? 'bg-nature-900 text-white'
                  : 'bg-white border border-nature-200 text-nature-600'
              }`}
            >
              {f.label}
              <span className={`text-[10px] ${filter === f.id ? 'text-white/70' : 'text-nature-400'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {/* Upcoming Birthdays Alert */}
        {upcomingBirthdays.length > 0 && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <Gift size={20} className="text-rose-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-rose-900">Aniversários Próximos</p>
                <p className="text-xs text-rose-700/70">
                  {upcomingBirthdays.map(p => p.name).join(', ')}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Patient Cards */}
        <div className="space-y-4">
          {filteredPatients.map(patient => (
            <Card key={patient.id} className="p-5">
              <div className="flex items-start gap-4">
                <DynamicAvatar user={{ name: patient.name, avatar: patient.avatar }} size="lg" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-nature-900">{patient.name}</h4>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${getStatusColor(patient.status)}`}>
                        {getStatusLabel(patient.status)}
                      </span>
                    </div>
                    <button 
                      onClick={() => setSelectedPatient(patient)}
                      className="p-2 text-nature-400"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-nature-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {patient.totalSessions} sessões
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(patient.lastSession).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {patient.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-nature-100 text-nature-500 text-[10px] rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-nature-400 mb-1">
                      <span>Progresso na jornada</span>
                      <span>{patient.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-nature-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all"
                        style={{ width: `${patient.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Next appointment */}
                  {patient.nextAppointment && (
                    <div className="mt-3 p-2 bg-primary-50 rounded-lg text-xs text-primary-700 flex items-center gap-2">
                      <Calendar size={14} />
                      Próxima sessão: {new Date(patient.nextAppointment).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-nature-100">
                <button
                  onClick={() => onSendMessage(patient.id)}
                  className="flex-1 py-2 bg-nature-50 text-nature-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                >
                  <MessageCircle size={14} />
                  Mensagem
                </button>
                <button
                  onClick={() => onSchedule(patient.id)}
                  className="flex-1 py-2 bg-primary-50 text-primary-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Calendar size={14} />
                  Agendar
                </button>
                <button
                  onClick={() => onViewRecords(patient.id)}
                  className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                >
                  <FileText size={14} />
                  Prontuário
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-[300] flex items-end animate-in fade-in">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedPatient(null)} />
          <div className="relative w-full bg-white rounded-t-[2rem] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1 bg-nature-200 rounded-full mx-auto mb-6" />
            
            <div className="flex items-center gap-4 mb-6">
              <DynamicAvatar user={{ name: selectedPatient.name }} size="xl" />
              <div>
                <h3 className="text-xl font-bold text-nature-900">{selectedPatient.name}</h3>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedPatient.status)}`}>
                  {getStatusLabel(selectedPatient.status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-4 text-center">
                <Calendar size={20} className="mx-auto text-primary-500 mb-1" />
                <p className="text-xl font-bold text-nature-900">{selectedPatient.totalSessions}</p>
                <p className="text-[10px] text-nature-400 uppercase">Sessões</p>
              </Card>
              <Card className="p-4 text-center">
                <TrendingUp size={20} className="mx-auto text-emerald-500 mb-1" />
                <p className="text-xl font-bold text-nature-900">{selectedPatient.progress}%</p>
                <p className="text-[10px] text-nature-400 uppercase">Progresso</p>
              </Card>
              <Card className="p-4 text-center">
                <Heart size={20} className="mx-auto text-rose-500 mb-1" />
                <p className="text-xl font-bold text-nature-900">4.9</p>
                <p className="text-[10px] text-nature-400 uppercase">Satisfação</p>
              </Card>
            </div>

            {selectedPatient.phone && (
              <button className="w-full mb-3 p-4 bg-nature-50 rounded-2xl flex items-center gap-3">
                <Phone size={18} className="text-nature-400" />
                <span className="text-nature-600">{selectedPatient.phone}</span>
                <ChevronRight size={18} className="ml-auto text-nature-300" />
              </button>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => { onViewPatient(selectedPatient.id); setSelectedPatient(null); }}
                className="flex-1 py-4 bg-nature-900 text-white rounded-xl font-bold"
              >
                Ver Perfil Completo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientGarden;
