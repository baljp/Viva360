
import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { 
  Sun, X, Droplets, Heart, Sparkles, Activity, CheckCircle2, ShieldCheck, 
  ChevronRight, Sprout, Leaf, Flower, Trees, Wind, Music, Calendar, Bell, 
  CheckCheck, Zap, Trophy, TrendingUp, Flame, Smile, Frown, Meh, CloudRain, Star
} from 'lucide-react';
import { User as UserType, UserRole, PlantStage, MoodType, DailyQuest, Notification, Badge, Appointment } from '../types';
import { api } from '../services/api';

// --- AURORA BACKGROUND ---
export const AuroraBackground: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-primary-100/20 rounded-full blur-[120px] animate-pulse"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-100/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
    <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-indigo-100/10 rounded-full blur-[80px] animate-pulse delay-1000"></div>
  </div>
);

// --- DYNAMIC AVATAR (Memoized) ---
export const DynamicAvatar = memo<{ user: Partial<UserType>, size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }>(({ user, size = 'md', className = "" }) => {
  const sizeClasses = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-20 h-20', xl: 'w-32 h-32' };
  return (
    <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden border-2 border-white shadow-sm bg-nature-100 flex-none relative`}>
      <img src={user.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name || 'user'}`} className="w-full h-full object-cover" alt={user.name} loading="lazy" />
    </div>
  );
});

// --- MOOD TRACKER (NOVO) ---
export const MoodTracker: React.FC<{ currentMood?: MoodType, onSelect: (m: MoodType) => void }> = ({ currentMood, onSelect }) => {
    const moods: { type: MoodType, icon: any, color: string }[] = [
        { type: 'SERENO', icon: Wind, color: 'bg-emerald-100 text-emerald-600' },
        { type: 'VIBRANTE', icon: Sun, color: 'bg-amber-100 text-amber-600' },
        { type: 'FOCADO', icon: Zap, color: 'bg-indigo-100 text-indigo-600' },
        { type: 'MELANCÓLICO', icon: CloudRain, color: 'bg-blue-100 text-blue-600' },
        { type: 'EXAUSTO', icon: Frown, color: 'bg-stone-100 text-stone-600' },
    ];

    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
            <h4 className="font-bold text-nature-900 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity size={14} className="text-primary-500" /> Como está sua energia?
            </h4>
            <div className="flex justify-between items-center gap-2">
                {moods.map(m => (
                    <button 
                        key={m.type}
                        onClick={() => onSelect(m.type)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all ${currentMood === m.type ? 'scale-110 ring-2 ring-primary-200' : 'opacity-70 hover:opacity-100'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${m.color}`}>
                            <m.icon size={20} />
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-nature-400">{m.type}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- ZEN TOAST ---
export const ZenToast: React.FC<{ toast: { title: string, message: string }, onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 4000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-sm animate-in slide-in-from-top duration-500">
      <div className="bg-white/90 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-2xl flex items-start gap-4">
        <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shrink-0"><Sparkles size={20} className="animate-pulse" /></div>
        <div className="flex-1">
          <h4 className="font-serif italic text-nature-900 leading-tight">{toast.title}</h4>
          <p className="text-xs text-nature-500 mt-1">{toast.message}</p>
        </div>
        <button onClick={onClose} className="text-nature-300 p-1"><X size={16}/></button>
      </div>
    </div>
  );
};

// --- PORTAL CARD ---
export const PortalCard: React.FC<{ title: string, subtitle: string, icon: React.FC<any>, bgImage: string, onClick: () => void, delay?: number }> = ({ title, subtitle, icon: Icon, bgImage, onClick, delay = 0 }) => (
  <button onClick={onClick} style={{ animationDelay: `${delay}ms` }} className="relative aspect-square rounded-[2.5rem] overflow-hidden group shadow-lg hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-up">
    <img src={bgImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={title} />
    <div className="absolute inset-0 bg-gradient-to-t from-nature-900/90 via-nature-900/40 to-transparent group-hover:from-primary-900/90 transition-colors"></div>
    <div className="absolute inset-0 p-6 flex flex-col justify-end text-left">
      <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white mb-3 group-hover:bg-white/20 transition-all"><Icon size={20} /></div>
      <p className="text-[8px] font-bold text-white/60 uppercase tracking-[0.3em] mb-1">{subtitle}</p>
      <h3 className="text-lg font-serif italic text-white leading-tight">{title}</h3>
    </div>
  </button>
);

// --- DAILY BLESSING (CHECK-IN) ---
export const DailyBlessing: React.FC<{ user: UserType, onCheckIn: () => void }> = ({ user, onCheckIn }) => {
    const today = new Date().toISOString().split('T')[0];
    if (user.lastCheckIn === today) return null;

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-nature-900/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-white rounded-[3.5rem] p-10 max-w-sm w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-50 to-transparent opacity-50"></div>
                <div className="relative">
                    <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-inner">
                        <Sun size={48} className="animate-spin-slow" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-primary-600 text-white p-2 rounded-full shadow-lg"><Zap size={16} fill="currentColor"/></div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-3xl font-serif italic text-nature-900">Bênção do Dia</h3>
                    <p className="text-sm text-nature-500 leading-relaxed italic">"Sua energia é o motor deste ecossistema. Receba sua luz diária."</p>
                </div>
                <div className="bg-nature-50 p-4 rounded-3xl border border-nature-100">
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-1">Recompensa</p>
                    <p className="text-2xl font-serif text-primary-700">+{50 * (user.multiplier || 1)} Karma</p>
                </div>
                <button onClick={onCheckIn} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Sintonizar Agora</button>
            </div>
        </div>
    );
}

export const SoulGarden: React.FC<{ user: UserType, onWater: () => void }> = ({ user, onWater }) => {
  const stageIcons: Record<string, any> = { seed: Sprout, sprout: Leaf, sapling: Flower, bloom: Sparkles, tree: Trees };
  const stageKey = (user.plantStage || 'SEED').toLowerCase();
  const Icon = stageIcons[stageKey] || Sprout;
  const stageLabels: Record<string, string> = { seed: 'Semente', sprout: 'Brotar', sapling: 'Muda', bloom: 'Florescer', tree: 'Árvore' };
  
  // Plant State Logic
  const isThirsty = (user.plantState || 'HEALTHY') === 'THIRSTY';
  const stateColor = isThirsty ? 'text-amber-500' : 'text-primary-600';
  const stateBg = isThirsty ? 'bg-amber-100/50' : 'bg-primary-50';

  return (
    <div className={`bg-white/80 backdrop-blur-xl p-8 rounded-[3.5rem] border transition-all duration-700 shadow-xl flex flex-col items-center text-center gap-6 relative overflow-hidden group ${isThirsty ? 'border-amber-200 shadow-amber-900/10' : 'border-nature-100'}`}>
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-[120px] transition-transform group-hover:scale-110 ${isThirsty ? 'bg-amber-100/30' : 'bg-primary-100/30'}`}></div>
      
      <div className="relative">
          <div className={`absolute inset-0 blur-3xl rounded-full scale-150 animate-pulse ${isThirsty ? 'bg-amber-400/20' : 'bg-primary-400/20'}`}></div>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center relative z-10 border shadow-inner group-hover:rotate-12 transition-transform duration-700 ${stateBg} ${isThirsty ? 'border-amber-200' : 'border-primary-100'}`}>
            <Icon size={48} className={`transition-colors duration-500 ${stateColor} ${isThirsty ? 'animate-pulse-slow' : ''}`} />
          </div>
          {isThirsty && (
              <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-2 rounded-full shadow-lg animate-bounce z-20">
                  <Droplets size={16} fill="currentColor" />
              </div>
          )}
      </div>

      <div className="space-y-1 relative z-10">
          <h3 className="text-2xl font-serif italic text-nature-900">Jardim da Alma</h3>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-bold text-primary-700 uppercase tracking-widest">{stageLabels[stageKey] || stageLabels['seed']}</span>
            <span className="w-1 h-1 bg-nature-200 rounded-full"></span>
            <span className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Nível {Math.floor((user.plantXp || 0) / 20) + 1}</span>
          </div>
      </div>

      <div className="w-full max-w-[160px] h-2 bg-nature-100 rounded-full overflow-hidden border border-nature-200 shadow-inner">
        <div className={`h-full transition-all duration-[2000ms] ${isThirsty ? 'bg-amber-400' : 'bg-gradient-to-r from-primary-400 to-primary-600'}`} style={{ width: `${(user.plantXp || 0) % 100}%` }}></div>
      </div>

      <button 
        onClick={onWater} 
        className={`px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2 transition-all active:scale-95 shadow-lg relative overflow-hidden group/btn ${isThirsty ? 'bg-amber-500 text-white animate-pulse-gentle hover:bg-amber-600' : 'bg-nature-900 text-white hover:bg-black'}`}
      >
        <span className="relative z-10 flex items-center gap-2">
            <Droplets size={14} className={isThirsty ? "animate-bounce" : "group-hover/btn:animate-bounce"} /> 
            {isThirsty ? "Regar Agora" : "Nutrir Essência"}
        </span>
      </button>
    </div>
  );
};

export const DailyQuestsWidget: React.FC<{ quests: DailyQuest[], onComplete: (id: string) => void }> = ({ quests, onComplete }) => (
  <div className="space-y-3">
    {quests.map(q => (
      <button key={q.id} onClick={() => onComplete(q.id)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 group ${q.isCompleted ? 'bg-emerald-50 border-emerald-100 opacity-60' : 'bg-white border-nature-100 hover:border-primary-300'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${q.isCompleted ? 'bg-emerald-500 text-white' : 'bg-nature-50 text-nature-400'}`}>
            {q.isCompleted ? <CheckCheck size={24}/> : <Activity size={24}/>}
          </div>
          <div className="text-left">
            <h5 className="text-xs font-bold text-nature-900">{q.label}</h5>
            <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest">+{q.reward} Karma</p>
          </div>
        </div>
        <ChevronRight size={16} className={q.isCompleted ? 'text-emerald-400' : 'text-nature-200'} />
      </button>
    ))}
  </div>
);

export const VerifiedBadge: React.FC<{ label: string, className?: string }> = ({ label, className = "" }) => (
  <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 ${className}`}>
    <ShieldCheck size={12} />
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </div>
);

export const BottomSheet: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-nature-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-t-[3.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="w-12 h-1.5 bg-nature-100 rounded-full mx-auto mb-6"></div>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-serif italic text-nature-900">{title}</h3>
          <button onClick={onClose} className="p-3 bg-nature-50 rounded-2xl text-nature-300"><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const CameraWidget: React.FC<{ onCapture: (img: string) => void }> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => { navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; }); }, []);
  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0); onCapture(canvasRef.current.toDataURL('image/jpeg'));
      }
    }
  };
  return (
    <div className="relative aspect-[3/4] w-full bg-black rounded-3xl overflow-hidden">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />
      <button onClick={capture} className="absolute bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white/20 backdrop-blur-md rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-all">
        <div className="w-14 h-14 bg-white rounded-full"></div>
      </button>
    </div>
  );
};

export const NotificationDrawer: React.FC<{ isOpen: boolean, onClose: () => void, notifications: Notification[], onMarkAsRead: (id: string) => void, onMarkAllRead: () => void }> = ({ isOpen, onClose, notifications, onMarkAsRead, onMarkAllRead }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-nature-900/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col rounded-l-[3rem]">
        <header className="p-8 flex justify-between items-center border-b border-nature-100">
          <h3 className="text-xl font-serif italic text-nature-900">Notificações</h3>
          <div className="flex gap-2">
            <button onClick={onMarkAllRead} className="text-[10px] font-bold uppercase tracking-widest text-primary-600">Limpar</button>
            <button onClick={onClose} className="p-2 bg-nature-50 rounded-xl"><X size={20}/></button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {notifications.length === 0 ? (
              <p className="text-center text-nature-400 py-10 text-sm">Tudo tranquilo por aqui.</p>
          ) : (
             notifications.map(n => (
                <div key={n.id} onClick={() => onMarkAsRead(n.id)} className={`p-4 rounded-2xl border transition-all ${n.read ? 'bg-nature-50/50 opacity-60' : 'bg-white border-primary-100 shadow-sm cursor-pointer hover:bg-primary-50'}`}>
                  <h4 className="font-bold text-xs text-nature-900">{n.title}</h4>
                  <p className="text-[11px] text-nature-500 mt-1">{n.message}</p>
                  <p className="text-[9px] text-nature-300 mt-2 text-right">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export const CalendarWidget: React.FC = () => (
  <div className="bg-white p-8 rounded-[3rem] border border-nature-100 shadow-sm text-center">
    <Calendar size={40} className="mx-auto text-primary-500 mb-4" />
    <h4 className="font-serif italic text-lg text-nature-900">Agenda Holística</h4>
    <p className="text-xs text-nature-400 mt-2">Sincronize com os ritmos cósmicos.</p>
  </div>
);

// Memoized Card component
export const Card = memo<{ children: React.ReactNode, className?: string }>(({ children, className = "" }) => (
  <div className={`bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm ${className}`}>{children}</div>
));

// Memoized Skeleton component
export const OrganicSkeleton = memo<{ className?: string }>(({ className = "" }) => (
  <div className={`bg-nature-100 animate-pulse rounded-[2rem] ${className}`}></div>
));

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
