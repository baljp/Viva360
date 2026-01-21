import React, { useState } from 'react';
import { ChevronLeft, Plus, Users, Calendar, DollarSign, Star, MoreVertical, Building, CheckCircle, Clock, TrendingUp, Filter, Search, UserPlus, FileText } from 'lucide-react';
import { Card, DynamicAvatar } from './Common';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  specialty: string[];
  commissionRate: number;
  totalSessions: number;
  totalRevenue: number;
  avgRating: number;
  isActive: boolean;
  contractType: string;
  startDate: string;
}

interface Room {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
  currentOccupant?: string;
  pricePerHour: number;
  amenities: string[];
}

interface SpaceManagementProps {
  spaceName: string;
  onClose: () => void;
}

export const SpaceManagement: React.FC<SpaceManagementProps> = ({ spaceName, onClose }) => {
  const [activeTab, setActiveTab] = useState<'team' | 'rooms'>('team');
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Mock team data
  const teamMembers: TeamMember[] = [
    { id: '1', name: 'Luna Chen', role: 'PROFESSIONAL', specialty: ['Yoga', 'Meditação'], commissionRate: 0.7, totalSessions: 156, totalRevenue: 23400, avgRating: 4.9, isActive: true, contractType: 'PJ', startDate: '2023-06-01' },
    { id: '2', name: 'Marco Silva', role: 'PROFESSIONAL', specialty: ['Reiki', 'Terapia'], commissionRate: 0.65, totalSessions: 98, totalRevenue: 14700, avgRating: 4.8, isActive: true, contractType: 'PJ', startDate: '2023-09-15' },
    { id: '3', name: 'Ana Ramalho', role: 'ADMIN', specialty: ['Recepção'], commissionRate: 0, totalSessions: 0, totalRevenue: 0, avgRating: 0, isActive: true, contractType: 'CLT', startDate: '2023-03-01' },
    { id: '4', name: 'Sofia Costa', role: 'PROFESSIONAL', specialty: ['Ayurveda'], commissionRate: 0.75, totalSessions: 45, totalRevenue: 9000, avgRating: 4.7, isActive: false, contractType: 'PARTNER', startDate: '2024-01-01' },
  ];

  // Mock rooms data
  const rooms: Room[] = [
    { id: '1', name: 'Sala Serenidade', status: 'occupied', currentOccupant: 'Luna Chen', pricePerHour: 50, amenities: ['Ar condicionado', 'Colchonetes', 'Som ambiente'] },
    { id: '2', name: 'Sala Harmonia', status: 'available', pricePerHour: 60, amenities: ['Ar condicionado', 'Maca', 'Iluminação zen'] },
    { id: '3', name: 'Sala Equilíbrio', status: 'available', pricePerHour: 45, amenities: ['Ventilador', 'Almofadas', 'Espelho'] },
    { id: '4', name: 'Sala Luz', status: 'maintenance', pricePerHour: 55, amenities: ['Ar condicionado', 'Projetor', 'Som'] },
  ];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'PROFESSIONAL': return 'Profissional';
      case 'ADMIN': return 'Administrador';
      case 'RECEPTIONIST': return 'Recepcionista';
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500';
      case 'occupied': return 'bg-amber-500';
      case 'maintenance': return 'bg-rose-500';
      default: return 'bg-nature-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponível';
      case 'occupied': return 'Ocupada';
      case 'maintenance': return 'Manutenção';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col animate-in slide-in-from-right">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-4 bg-white border-b border-nature-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all">
            <ChevronLeft size={22} />
          </button>
          <div>
            <h2 className="text-xl font-serif italic text-nature-900">Gestão do Espaço</h2>
            <p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">{spaceName}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddMember(true)}
          className="p-3 bg-primary-500 text-white rounded-2xl"
        >
          <Plus size={22} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 px-6 py-4 bg-white border-b border-nature-100">
        {[
          { id: 'team', label: 'Equipe', icon: Users, count: teamMembers.length },
          { id: 'rooms', label: 'Salas', icon: Building, count: rooms.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-nature-900 text-white'
                : 'bg-nature-50 text-nature-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id ? 'bg-white/20' : 'bg-nature-200'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {activeTab === 'team' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card className="p-3 text-center">
                <p className="text-xl font-bold text-emerald-600">{teamMembers.filter(m => m.isActive).length}</p>
                <p className="text-[9px] text-nature-400 uppercase">Ativos</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xl font-bold text-primary-600">{teamMembers.reduce((sum, m) => sum + m.totalSessions, 0)}</p>
                <p className="text-[9px] text-nature-400 uppercase">Sessões Total</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xl font-bold text-amber-600">{formatCurrency(teamMembers.reduce((sum, m) => sum + m.totalRevenue, 0)).replace('R$', '')}</p>
                <p className="text-[9px] text-nature-400 uppercase">Receita</p>
              </Card>
            </div>

            {/* Team list */}
            {teamMembers.map(member => (
              <Card key={member.id} className={`p-5 ${!member.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <DynamicAvatar user={{ name: member.name, avatar: member.avatar }} size="lg" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${member.isActive ? 'bg-emerald-500' : 'bg-nature-300'}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-nature-900">{member.name}</h4>
                        <p className="text-[10px] text-nature-400 uppercase tracking-widest">{getRoleLabel(member.role)}</p>
                      </div>
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="p-2 text-nature-400"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.specialty.map(spec => (
                        <span key={spec} className="px-2 py-0.5 bg-primary-50 text-primary-600 text-[10px] rounded-full">
                          {spec}
                        </span>
                      ))}
                    </div>

                    {member.role === 'PROFESSIONAL' && (
                      <div className="flex items-center gap-4 mt-3 text-xs text-nature-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {member.totalSessions} sessões
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} />
                          {formatCurrency(member.totalRevenue)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-amber-500" />
                          {member.avgRating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-3 text-[10px] text-nature-400">
                      <span className="px-2 py-0.5 bg-nature-100 rounded-full">{member.contractType}</span>
                      <span>Comissão: {(member.commissionRate * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="space-y-4">
            {/* Room stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card className="p-3 text-center">
                <p className="text-xl font-bold text-emerald-600">{rooms.filter(r => r.status === 'available').length}</p>
                <p className="text-[9px] text-nature-400 uppercase">Disponíveis</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xl font-bold text-amber-600">{rooms.filter(r => r.status === 'occupied').length}</p>
                <p className="text-[9px] text-nature-400 uppercase">Ocupadas</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-xl font-bold text-rose-600">{rooms.filter(r => r.status === 'maintenance').length}</p>
                <p className="text-[9px] text-nature-400 uppercase">Manutenção</p>
              </Card>
            </div>

            {/* Room list */}
            {rooms.map(room => (
              <Card key={room.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(room.status)}`} />
                    <div>
                      <h4 className="font-bold text-nature-900">{room.name}</h4>
                      <p className="text-[10px] text-nature-400 uppercase">{getStatusLabel(room.status)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-primary-600">{formatCurrency(room.pricePerHour)}/h</span>
                </div>

                {room.currentOccupant && (
                  <div className="mb-3 p-2 bg-amber-50 rounded-lg text-xs text-amber-700 flex items-center gap-2">
                    <Clock size={14} />
                    Em uso por {room.currentOccupant}
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {room.amenities.map(amenity => (
                    <span key={amenity} className="px-2 py-0.5 bg-nature-100 text-nature-500 text-[10px] rounded-full">
                      {amenity}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-nature-100">
                  <button className="flex-1 py-2 bg-primary-50 text-primary-600 rounded-xl text-xs font-bold">
                    Ver Agenda
                  </button>
                  <button className="flex-1 py-2 bg-nature-50 text-nature-600 rounded-xl text-xs font-bold">
                    Editar
                  </button>
                </div>
              </Card>
            ))}

            <button className="w-full p-4 border-2 border-dashed border-nature-200 rounded-2xl flex items-center justify-center gap-2 text-nature-400 font-bold">
              <Plus size={20} />
              Adicionar Sala
            </button>
          </div>
        )}
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-[300] flex items-end animate-in fade-in">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedMember(null)} />
          <div className="relative w-full bg-white rounded-t-[2rem] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom">
            <div className="w-12 h-1 bg-nature-200 rounded-full mx-auto mb-6" />
            
            <div className="flex items-center gap-4 mb-6">
              <DynamicAvatar user={{ name: selectedMember.name }} size="xl" />
              <div>
                <h3 className="text-xl font-bold text-nature-900">{selectedMember.name}</h3>
                <p className="text-nature-500">{getRoleLabel(selectedMember.role)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full p-4 bg-nature-50 rounded-xl flex items-center gap-3 text-left">
                <FileText size={18} className="text-nature-400" />
                <span className="flex-1 text-nature-900">Ver Contrato</span>
                <ChevronLeft size={18} className="rotate-180 text-nature-300" />
              </button>
              <button className="w-full p-4 bg-nature-50 rounded-xl flex items-center gap-3 text-left">
                <DollarSign size={18} className="text-nature-400" />
                <span className="flex-1 text-nature-900">Histórico de Pagamentos</span>
                <ChevronLeft size={18} className="rotate-180 text-nature-300" />
              </button>
              <button className="w-full p-4 bg-nature-50 rounded-xl flex items-center gap-3 text-left">
                <TrendingUp size={18} className="text-nature-400" />
                <span className="flex-1 text-nature-900">Relatório de Desempenho</span>
                <ChevronLeft size={18} className="rotate-180 text-nature-300" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceManagement;
