import React, { useState, useEffect } from 'react';
import { ChevronLeft, Users, Heart, Flame, Send, Plus, Crown, Sparkles, MessageCircle, Gift, Star, Trophy, TrendingUp, X } from 'lucide-react';
import { User } from '../types';
import { Card, DynamicAvatar } from './Common';

interface TribeMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    streak: number;
    karma: number;
  };
  role: string;
  energySent: number;
  energyReceived: number;
  joinedAt: string;
}

interface Tribe {
  id: string;
  name: string;
  description?: string;
  maxMembers: number;
  totalKarma: number;
  weeklyKarma: number;
  members: TribeMember[];
}

interface TribeScreenProps {
  user: User;
  onClose: () => void;
  onSendEnergy: (memberId: string, amount: number, message?: string) => void;
  onOpenChat: () => void;
}

export const TribeScreen: React.FC<TribeScreenProps> = ({ user, onClose, onSendEnergy, onOpenChat }) => {
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSendEnergy, setShowSendEnergy] = useState<string | null>(null);
  const [energyAmount, setEnergyAmount] = useState(10);
  const [energyMessage, setEnergyMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'activity' | 'challenges'>('members');

  // Mock data - replace with API
  useEffect(() => {
    const mockTribe: Tribe = {
      id: '1',
      name: 'Círculo da Serenidade',
      description: 'Unidos na jornada de autoconhecimento',
      maxMembers: 7,
      totalKarma: 4520,
      weeklyKarma: 340,
      members: [
        {
          id: '1',
          userId: 'current',
          user: { id: 'current', name: user.name, avatar: user.avatar, streak: user.streak || 0, karma: user.karma },
          role: 'OWNER',
          energySent: 150,
          energyReceived: 200,
          joinedAt: '2024-01-01',
        },
        {
          id: '2',
          userId: '2',
          user: { id: '2', name: 'Luna Chen', avatar: undefined, streak: 12, karma: 890 },
          role: 'ELDER',
          energySent: 320,
          energyReceived: 280,
          joinedAt: '2024-01-05',
        },
        {
          id: '3',
          userId: '3',
          user: { id: '3', name: 'Marco Silva', avatar: undefined, streak: 8, karma: 650 },
          role: 'MEMBER',
          energySent: 180,
          energyReceived: 150,
          joinedAt: '2024-01-10',
        },
        {
          id: '4',
          userId: '4',
          user: { id: '4', name: 'Sofia Ramalho', avatar: undefined, streak: 15, karma: 1200 },
          role: 'MEMBER',
          energySent: 420,
          energyReceived: 380,
          joinedAt: '2024-01-12',
        },
      ],
    };
    setTribe(mockTribe);
    setIsLoading(false);
  }, [user]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER': return { icon: Crown, color: 'text-amber-500', label: 'Líder' };
      case 'ELDER': return { icon: Star, color: 'text-purple-500', label: 'Ancião' };
      default: return { icon: Users, color: 'text-nature-400', label: 'Membro' };
    }
  };

  const handleSendEnergy = (memberId: string) => {
    onSendEnergy(memberId, energyAmount, energyMessage);
    setShowSendEnergy(null);
    setEnergyAmount(10);
    setEnergyMessage('');
  };

  // Mock activities
  const activities = [
    { id: '1', user: 'Luna Chen', action: 'completou meditação de 20min', time: '5min', icon: Sparkles },
    { id: '2', user: 'Marco Silva', action: 'enviou energia para você', time: '1h', icon: Heart },
    { id: '3', user: 'Sofia Ramalho', action: 'desbloqueou Streak de 15 dias', time: '2h', icon: Flame },
    { id: '4', user: 'Luna Chen', action: 'completou desafio semanal', time: '5h', icon: Trophy },
  ];

  // Mock challenges
  const challenges = [
    { id: '1', title: 'Meditação em Grupo', description: 'Todos meditarem 10min hoje', progress: 3, total: 4, reward: 100 },
    { id: '2', title: 'Energia Coletiva', description: 'Enviar 50 de energia total', progress: 35, total: 50, reward: 150 },
  ];

  if (isLoading || !tribe) {
    return (
      <div className="fixed inset-0 z-[200] bg-nature-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col animate-in slide-in-from-right">
      {/* Header */}
      <header className="px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-gradient-to-b from-primary-600 to-primary-700">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white active:scale-90 transition-all">
            <ChevronLeft size={22} />
          </button>
          <button onClick={onOpenChat} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl text-white">
            <MessageCircle size={22} />
          </button>
        </div>
        
        <div className="text-center text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={36} />
          </div>
          <h2 className="text-2xl font-serif italic">{tribe.name}</h2>
          <p className="text-white/70 text-sm mt-1">{tribe.description}</p>
          
          <div className="flex justify-center gap-8 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{tribe.members.length}/{tribe.maxMembers}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-widest">Membros</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{tribe.totalKarma}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-widest">Karma Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-300">+{tribe.weeklyKarma}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-widest">Esta Semana</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 px-6 py-4 bg-white border-b border-nature-100">
        {[
          { id: 'members', label: 'Membros', icon: Users },
          { id: 'activity', label: 'Atividade', icon: TrendingUp },
          { id: 'challenges', label: 'Desafios', icon: Trophy },
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
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {activeTab === 'members' && (
          <div className="space-y-4">
            {tribe.members.map(member => {
              const role = getRoleBadge(member.role);
              const isCurrentUser = member.userId === 'current';
              
              return (
                <Card key={member.id} className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <DynamicAvatar user={member.user} size="lg" />
                      <role.icon size={14} className={`absolute -bottom-1 -right-1 ${role.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-nature-900">{member.user.name}</h4>
                        {isCurrentUser && <span className="text-[8px] bg-nature-100 text-nature-500 px-2 py-0.5 rounded-full">VOCÊ</span>}
                      </div>
                      <p className="text-[10px] text-nature-400 uppercase tracking-widest">{role.label}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-nature-500">
                        <span className="flex items-center gap-1">
                          <Flame size={12} className="text-orange-500" />
                          {member.user.streak} dias
                        </span>
                        <span className="flex items-center gap-1">
                          <Sparkles size={12} className="text-primary-500" />
                          {member.user.karma} karma
                        </span>
                      </div>
                    </div>
                    {!isCurrentUser && (
                      <button
                        onClick={() => setShowSendEnergy(member.id)}
                        className="p-3 bg-rose-50 text-rose-500 rounded-xl active:scale-90 transition-all"
                      >
                        <Heart size={20} />
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}

            {tribe.members.length < tribe.maxMembers && (
              <button className="w-full p-5 border-2 border-dashed border-nature-200 rounded-[2rem] flex items-center justify-center gap-3 text-nature-400">
                <Plus size={20} />
                <span className="text-sm font-medium">Convidar Membro</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-nature-100">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <activity.icon size={18} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-nature-900">
                    <span className="font-bold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-[10px] text-nature-400 mt-1">{activity.time} atrás</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-4">
            {challenges.map(challenge => (
              <Card key={challenge.id} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trophy size={24} className="text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-nature-900">{challenge.title}</h4>
                    <p className="text-xs text-nature-500 mt-1">{challenge.description}</p>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] text-nature-400 mb-1">
                        <span>{challenge.progress}/{challenge.total}</span>
                        <span>+{challenge.reward} karma</span>
                      </div>
                      <div className="h-2 bg-nature-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Send Energy Modal */}
      {showSendEnergy && (
        <div className="fixed inset-0 z-[300] flex items-end animate-in fade-in">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSendEnergy(null)} />
          <div className="relative w-full bg-white rounded-t-[2rem] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom">
            <div className="w-12 h-1 bg-nature-200 rounded-full mx-auto mb-6" />
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart size={28} className="text-rose-500" />
              </div>
              <h3 className="text-xl font-serif italic text-nature-900">Enviar Energia</h3>
              <p className="text-sm text-nature-500 mt-1">Compartilhe karma com seu amigo</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Quantidade</label>
                <div className="flex gap-2 mt-2">
                  {[5, 10, 25, 50].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setEnergyAmount(amount)}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                        energyAmount === amount
                          ? 'bg-rose-500 text-white'
                          : 'bg-nature-50 text-nature-600'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Mensagem (opcional)</label>
                <input
                  type="text"
                  value={energyMessage}
                  onChange={(e) => setEnergyMessage(e.target.value)}
                  placeholder="Conte algo especial..."
                  className="w-full mt-2 p-4 bg-nature-50 rounded-xl outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>
            </div>

            <button
              onClick={() => handleSendEnergy(showSendEnergy)}
              className="w-full py-5 bg-rose-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"
            >
              <Send size={18} />
              Enviar {energyAmount} de Energia
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TribeScreen;
