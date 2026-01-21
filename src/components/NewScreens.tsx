import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Leaf, Moon, Sun, Wind, Waves, Heart, Sparkles, ChevronLeft, Clock, Trophy, Star, Flame, Zap, Target, Award, Shield, Crown, CheckCircle2 } from 'lucide-react';
import { User, Badge } from '../types';
import { Card } from './Common';

// ================================
// TELA DE MEDITAÇÃO GUIADA
// ================================

interface MeditationSession {
  id: string;
  name: string;
  duration: number; // minutes
  icon: React.FC<any>;
  color: string;
  bgGradient: string;
  description: string;
}

const meditationSessions: MeditationSession[] = [
  {
    id: 'breath',
    name: 'Respiração Consciente',
    duration: 5,
    icon: Wind,
    color: 'text-emerald-600',
    bgGradient: 'from-emerald-50 to-emerald-100',
    description: 'Acalme sua mente através da respiração profunda e consciente.'
  },
  {
    id: 'sleep',
    name: 'Sono Profundo',
    duration: 10,
    icon: Moon,
    color: 'text-indigo-600',
    bgGradient: 'from-indigo-50 to-indigo-100',
    description: 'Prepare seu corpo e mente para uma noite de descanso restaurador.'
  },
  {
    id: 'focus',
    name: 'Foco & Clareza',
    duration: 7,
    icon: Sun,
    color: 'text-amber-600',
    bgGradient: 'from-amber-50 to-amber-100',
    description: 'Aumente sua concentração e clareza mental para o dia.'
  },
  {
    id: 'nature',
    name: 'Conexão Natural',
    duration: 8,
    icon: Leaf,
    color: 'text-green-600',
    bgGradient: 'from-green-50 to-green-100',
    description: 'Conecte-se com a energia da natureza e da terra.'
  },
  {
    id: 'ocean',
    name: 'Ondas do Mar',
    duration: 15,
    icon: Waves,
    color: 'text-blue-600',
    bgGradient: 'from-blue-50 to-blue-100',
    description: 'Deixe as ondas do oceano levarem suas preocupações.'
  },
  {
    id: 'love',
    name: 'Amor Próprio',
    duration: 10,
    icon: Heart,
    color: 'text-rose-600',
    bgGradient: 'from-rose-50 to-rose-100',
    description: 'Cultive compaixão e amor por si mesmo.'
  },
];

export const MeditationScreen: React.FC<{
  onClose: () => void;
  onComplete: (minutes: number, karma: number) => void;
}> = ({ onClose, onComplete }) => {
  const [selectedSession, setSelectedSession] = useState<MeditationSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(t => {
          if (t <= 1) {
            setIsPlaying(false);
            onComplete(selectedSession?.duration || 0, (selectedSession?.duration || 0) * 10);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, timeRemaining]);

  // Breathing animation cycle
  useEffect(() => {
    if (isPlaying && selectedSession?.id === 'breath') {
      const cycle = setInterval(() => {
        setBreathPhase(p => {
          if (p === 'inhale') return 'hold';
          if (p === 'hold') return 'exhale';
          return 'inhale';
        });
      }, 4000);
      return () => clearInterval(cycle);
    }
  }, [isPlaying, selectedSession]);

  const startSession = (session: MeditationSession) => {
    setSelectedSession(session);
    setTimeRemaining(session.duration * 60);
    setIsPlaying(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resetSession = () => {
    setIsPlaying(false);
    if (selectedSession) {
      setTimeRemaining(selectedSession.duration * 60);
    }
  };

  // Active meditation view
  if (selectedSession && timeRemaining > 0) {
    const Icon = selectedSession.icon;
    const progress = ((selectedSession.duration * 60 - timeRemaining) / (selectedSession.duration * 60)) * 100;
    
    return (
      <div className="fixed inset-0 z-[200] bg-nature-900 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <button onClick={onClose} className="absolute top-12 right-8 p-3 bg-white/10 text-white rounded-full backdrop-blur-md">
          <X size={24} />
        </button>

        <div className="absolute top-12 left-8 flex gap-3">
          <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/10 text-white rounded-full backdrop-blur-md">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        {/* Progress ring */}
        <div className="relative w-72 h-72">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            <circle 
              cx="50" cy="50" r="45" fill="none" 
              stroke="url(#gradient)" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${progress * 2.83} 283`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="100%" stopColor="#6ee7b7" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${selectedSession.id === 'breath' ? 'animate-breathe' : 'animate-float'}`}>
              <Icon size={48} className="text-white/80" />
            </div>
            <span className="text-5xl font-serif italic text-white">{formatTime(timeRemaining)}</span>
            {selectedSession.id === 'breath' && (
              <span className="text-sm text-white/60 mt-2 uppercase tracking-widest font-bold">
                {breathPhase === 'inhale' ? 'Inspire...' : breathPhase === 'hold' ? 'Segure...' : 'Expire...'}
              </span>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-serif italic text-white mt-8">{selectedSession.name}</h2>
        <p className="text-white/50 text-sm mt-2 max-w-xs italic">{selectedSession.description}</p>

        <div className="flex gap-4 mt-12">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all"
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>
          <button 
            onClick={resetSession}
            className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/60 active:scale-90 transition-all"
          >
            <RotateCcw size={24} />
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-32 right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl animate-pulse delay-700" />
      </div>
    );
  }

  // Session completed view
  if (selectedSession && timeRemaining === 0) {
    return (
      <div className="fixed inset-0 z-[200] bg-nature-900 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
          <Sparkles size={64} className="text-emerald-400" />
        </div>
        <h2 className="text-4xl font-serif italic text-white">Namastê 🙏</h2>
        <p className="text-white/60 mt-4 max-w-xs italic leading-relaxed">
          Você completou {selectedSession.duration} minutos de {selectedSession.name.toLowerCase()}.
        </p>
        <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl mt-8">
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold">Karma Recebido</p>
          <p className="text-3xl font-serif italic text-emerald-400">+{selectedSession.duration * 10}</p>
        </div>
        <button 
          onClick={onClose}
          className="mt-12 px-12 py-5 bg-white text-nature-900 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
        >
          Voltar ao Santuário
        </button>
      </div>
    );
  }

  // Session selection view
  return (
    <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col animate-in slide-in-from-right">
      <header className="flex items-center gap-4 px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white border-b border-nature-100 shadow-sm">
        <button onClick={onClose} className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h2 className="text-xl font-serif italic text-nature-900">Meditação</h2>
          <p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">PORTAL DE PAZ</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        <div className="bg-gradient-to-br from-nature-900 to-nature-800 p-8 rounded-[3rem] text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl" />
          <Leaf size={32} className="text-primary-400 mb-4" />
          <h3 className="text-2xl font-serif italic">Encontre sua paz interior</h3>
          <p className="text-white/60 text-sm mt-2 italic leading-relaxed">
            Escolha uma sessão guiada e permita-se estar presente neste momento.
          </p>
        </div>

        <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-4 px-2">Sessões Disponíveis</h4>
        
        <div className="space-y-4">
          {meditationSessions.map(session => {
            const Icon = session.icon;
            return (
              <button
                key={session.id}
                onClick={() => startSession(session)}
                className={`w-full bg-gradient-to-br ${session.bgGradient} p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm active:scale-[0.98] transition-all group`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center ${session.color} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-nature-900">{session.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={12} className="text-nature-400" />
                      <span className="text-[10px] font-bold text-nature-400 uppercase">{session.duration} min</span>
                    </div>
                  </div>
                </div>
                <Play size={20} className="text-nature-400 group-hover:text-nature-900 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ================================
// TELA DE CONQUISTAS / BADGES
// ================================

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.FC<any>;
  color: string;
  bgColor: string;
  requirement: string;
  progress: number; // 0-100
  unlocked: boolean;
  unlockedAt?: string;
  karma: number;
}

const achievements: Achievement[] = [
  {
    id: 'first_session',
    name: 'Primeiro Passo',
    description: 'Complete sua primeira sessão',
    icon: Star,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    requirement: '1 sessão',
    progress: 100,
    unlocked: true,
    unlockedAt: '2026-01-15',
    karma: 50,
  },
  {
    id: 'week_streak',
    name: 'Dedicação Semanal',
    description: 'Faça check-in 7 dias seguidos',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    requirement: '7 dias',
    progress: 71,
    unlocked: false,
    karma: 200,
  },
  {
    id: 'meditation_master',
    name: 'Mestre Zen',
    description: 'Complete 10 sessões de meditação',
    icon: Leaf,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    requirement: '10 sessões',
    progress: 40,
    unlocked: false,
    karma: 300,
  },
  {
    id: 'social_butterfly',
    name: 'Borboleta Social',
    description: 'Conecte-se com 5 guardiões',
    icon: Heart,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
    requirement: '5 conexões',
    progress: 60,
    unlocked: false,
    karma: 150,
  },
  {
    id: 'energy_boost',
    name: 'Energia Radiante',
    description: 'Acumule 1000 pontos de karma',
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    requirement: '1000 karma',
    progress: 25,
    unlocked: false,
    karma: 500,
  },
  {
    id: 'tree_grower',
    name: 'Jardineiro Sagrado',
    description: 'Evolua sua planta para árvore',
    icon: Trophy,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    requirement: 'Nível Árvore',
    progress: 30,
    unlocked: false,
    karma: 1000,
  },
  {
    id: 'night_owl',
    name: 'Coruja Noturna',
    description: 'Complete 5 meditações de sono',
    icon: Moon,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    requirement: '5 meditações',
    progress: 20,
    unlocked: false,
    karma: 200,
  },
  {
    id: 'first_purchase',
    name: 'Explorador',
    description: 'Faça sua primeira compra no Bazar',
    icon: Target,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    requirement: '1 compra',
    progress: 0,
    unlocked: false,
    karma: 100,
  },
  {
    id: 'monthly_warrior',
    name: 'Guerreiro Mensal',
    description: 'Complete 30 dias de jornada',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    requirement: '30 dias',
    progress: 17,
    unlocked: false,
    karma: 500,
  },
  {
    id: 'legend',
    name: 'Lenda Viva',
    description: 'Alcance o nível máximo de prestígio',
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-gradient-to-br from-amber-50 to-yellow-100',
    requirement: 'Nível 10',
    progress: 10,
    unlocked: false,
    karma: 2000,
  },
];

export const AchievementsScreen: React.FC<{
  user: User;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalKarma = achievements.filter(a => a.unlocked).reduce((acc, a) => acc + a.karma, 0);

  return (
    <div className="fixed inset-0 z-[200] bg-nature-50 flex flex-col animate-in slide-in-from-right">
      <header className="flex items-center gap-4 px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 bg-white border-b border-nature-100 shadow-sm">
        <button onClick={onClose} className="p-3 bg-nature-50 rounded-2xl text-nature-600 active:scale-90 transition-all">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h2 className="text-xl font-serif italic text-nature-900">Conquistas</h2>
          <p className="text-[10px] text-nature-400 uppercase tracking-[0.3em] font-bold">JORNADA DE EVOLUÇÃO</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {/* Stats Header */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trophy size={24} className="text-amber-600" />
            </div>
            <p className="text-3xl font-serif italic text-nature-900">{unlockedCount}/{achievements.length}</p>
            <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest mt-1">Desbloqueadas</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} className="text-primary-600" />
            </div>
            <p className="text-3xl font-serif italic text-nature-900">{totalKarma}</p>
            <p className="text-[9px] font-bold text-nature-400 uppercase tracking-widest mt-1">Karma Total</p>
          </Card>
        </div>

        {/* Unlocked Achievements */}
        <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-500" />
          Conquistadas
        </h4>
        <div className="space-y-4 mb-8">
          {achievements.filter(a => a.unlocked).map(achievement => {
            const Icon = achievement.icon;
            return (
              <div key={achievement.id} className={`${achievement.bgColor} p-6 rounded-[2.5rem] flex items-center gap-4 shadow-sm border-2 border-white`}>
                <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center ${achievement.color} shadow-sm`}>
                  <Icon size={28} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-nature-900">{achievement.name}</h4>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <p className="text-[10px] text-nature-500 mt-0.5">{achievement.description}</p>
                  <p className="text-[9px] text-primary-600 font-bold mt-1">+{achievement.karma} karma recebido</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Locked Achievements */}
        <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-4 px-2">Em Progresso</h4>
        <div className="space-y-4">
          {achievements.filter(a => !a.unlocked).map(achievement => {
            const Icon = achievement.icon;
            return (
              <div key={achievement.id} className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 ${achievement.bgColor} rounded-2xl flex items-center justify-center ${achievement.color} opacity-60`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-nature-900">{achievement.name}</h4>
                    <p className="text-[10px] text-nature-400 mt-0.5">{achievement.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] font-bold text-nature-300 uppercase">{achievement.requirement}</span>
                      <span className="text-[9px] font-bold text-primary-600">+{achievement.karma} karma</span>
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-2 bg-nature-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-1000`}
                      style={{ width: `${achievement.progress}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-right text-nature-300 mt-1 font-bold">{achievement.progress}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default { MeditationScreen, AchievementsScreen };
