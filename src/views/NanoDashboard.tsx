
import React, { useState } from 'react';
import { User, ViewState, Product, MoodType } from '../types';
import { DynamicAvatar, PortalCard, Card, SoulGarden, MoodTracker, ZenToast } from '../components/Common';
import { Sparkles, Calendar, Zap, ArrowRight, Play, ShoppingBag, Moon, Sun, Camera, Activity, Compass, Heart, Map as MapIcon, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';

interface NanoDashboardProps {
  user: User;
  setView: (view: ViewState) => void;
  onAddToCart: (product: Product) => void;
  onMoodSelect: (mood: MoodType) => void;
  onCheckIn: () => void;
}

export const NanoDashboard: React.FC<NanoDashboardProps> = ({ user, setView, onAddToCart, onMoodSelect, onCheckIn }) => {
  const [period, setPeriod] = useState<'SEMANA' | 'MÊS'>('SEMANA');
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);

  // Helper to handle mood selection
  const handleMoodSelect = (mood: MoodType) => {
      onMoodSelect(mood);
      // Toast potentially handled by parent, or local feedback? Parent handles it in ClientViews
  };

  // Helper to handle check-in
  const handleCheckIn = () => {
       onCheckIn();
  };

  return (
    <div className="flex flex-col animate-in fade-in pb-24 selection:bg-primary-500 selection:text-white pt-24 space-y-8 px-4 sm:px-6">
        {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-2">
            <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em]">BUSCADOR • NÍVEL {Math.floor((user.plantXp || 0) / 100) + 1}</p>
                <h1 className="text-4xl font-serif font-medium text-nature-900 leading-tight">Salve, Viajante</h1>
            </div>
            <button onClick={() => setView(ViewState.SETTINGS)} className="w-16 h-16 rounded-[2rem] border-[4px] border-white shadow-xl shadow-nature-900/10 overflow-hidden active:scale-95 transition-all hover:rotate-3">
                <img src={user.avatar} className="w-full h-full object-cover" />
            </button>
        </header>

        {/* MOOD TRACKER */}
        <MoodTracker currentMood={user.lastMood} onSelect={handleMoodSelect} />

        {/* JARDIM DA ALMA */}
        <SoulGarden user={user} onWater={() => setToast({ title: "Essência Nutrid", message: "Sua planta agradece o cuidado." })} />

        {/* BENÇÃO DO DIA (Card Version) */}
        <div className="relative overflow-hidden bg-white rounded-[3.5rem] p-10 shadow-sm border border-nature-100 text-center space-y-6">
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-50 to-transparent opacity-50 pointer-events-none"></div>
             <div className="relative">
                <div className="w-24 h-24 bg-amber-100/50 rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-inner">
                    <Sun size={48} className="animate-spin-slow" />
                </div>
                 <div className="absolute -top-2 -right-2 bg-primary-600 text-white p-2 rounded-full shadow-lg"><Zap size={16} fill="currentColor"/></div>
             </div>
             <div className="space-y-2 relative z-10">
                <h3 className="text-3xl font-serif italic text-nature-900">Bênção do Dia</h3>
                <p className="text-sm text-nature-500 leading-relaxed italic max-w-xs mx-auto">"Sua energia é o motor deste ecossistema. Receba sua luz diária."</p>
            </div>
             <div className="bg-nature-50 p-4 rounded-3xl border border-nature-100 relative z-10">
                <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mb-1">Recompensa</p>
                <p className="text-2xl font-serif text-primary-700">+{50 * (user.multiplier || 1)} Karma</p>
            </div>
             <button onClick={handleCheckIn} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all relative z-10 hover:bg-black">Sintonizar Agora</button>
        </div>

        {/* VISUAL RECORD (Minha Metamorfose) */}
        <Card className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-serif italic text-nature-900">Minha Metamorfose</h3>
                    <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest mt-1">REGISTRO VISUAL</p>
                 </div>
                 <div className="flex bg-nature-50 rounded-full p-1 border border-nature-100">
                     {(['SEMANA', 'MÊS'] as const).map(p => (
                         <button 
                            key={p} 
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${period === p ? 'bg-white text-nature-900 shadow-sm' : 'text-nature-400 hover:text-nature-600'}`}
                         >
                             {p}
                         </button>
                     ))}
                 </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {/* Mock Photos */}
                {[1,2,3,4].map((i) => (
                    <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden relative group cursor-pointer">
                        <img src={`https://images.unsplash.com/photo-${1500000000000 + i * 1000}?w=400&h=600&fit=crop`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    </div>
                ))}
            </div>
             
             <div className="grid grid-cols-4 gap-3">
                 {[1,2,3,4].map(i => (
                     <button key={i} className="aspect-[3/4] rounded-2xl border-2 border-dashed border-nature-200 flex items-center justify-center text-nature-300 hover:text-primary-500 hover:border-primary-200 transition-all hover:bg-primary-50">
                         <Camera size={20} />
                     </button>
                 ))}
             </div>
        </Card>

        {/* FREQUENCY ANALYSIS */}
        <Card className="p-8 text-center space-y-6 relative overflow-hidden">
             <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto text-primary-600 relative z-10">
                 <Activity size={32}/>
             </div>
             
             <div className="space-y-2 relative z-10">
                 <h3 className="text-2xl font-serif italic text-nature-900">Análise de Frequência</h3>
                 <p className="text-sm text-nature-500 leading-relaxed max-w-sm mx-auto">Seus padrões sugerem uma evolução gradual da serenidade esta semana. Continue regando sua essência.</p>
             </div>

             {/* Simple Frequency Chart Visualization */}
             <div className="h-32 flex items-end justify-center gap-3 pt-6 relative z-10 px-4">
                 {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
                     <div key={i} className="w-full bg-nature-100 rounded-t-xl relative group overflow-hidden">
                         <div className="absolute bottom-0 left-0 w-full bg-primary-300 transition-all duration-1000 group-hover:bg-primary-400" style={{ height: `${h}%` }}></div>
                     </div>
                 ))}
             </div>
        </Card>

        {/* MOMENTO PRESENTE (Grid) */}
        <div className="space-y-4">
             <div className="flex items-center gap-4">
                <div className="h-px bg-nature-200 flex-1"></div>
                <span className="text-[10px] font-bold text-nature-400 uppercase tracking-[0.3em]">MOMENTO PRESENTE</span>
                <div className="h-px bg-nature-200 flex-1"></div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                 <PortalCard 
                    title="Explorar" 
                    subtitle="MAPA DE CURA" 
                    icon={Compass} 
                    bgImage="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=600" 
                    onClick={() => setView(ViewState.CLIENT_EXPLORE)} 
                />
                 <PortalCard 
                    title="Bazar" 
                    subtitle="FERRAMENTAS" 
                    icon={ShoppingBag} 
                    bgImage="https://images.unsplash.com/photo-1455165814004-1126a7199f9b?q=80&w=600" 
                    onClick={() => setView(ViewState.CLIENT_MARKETPLACE)} 
                    delay={100}
                />
                 <PortalCard 
                    title="Metamorfose" 
                    subtitle="JORNADA" 
                    icon={Sparkles} 
                    bgImage="https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=600" 
                    onClick={() => setView(ViewState.CLIENT_JOURNEY)} 
                    delay={200}
                />
                 <PortalCard 
                    title="Tribo" 
                    subtitle="SINCRO" 
                    icon={Heart} 
                    bgImage="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600" 
                    onClick={() => setView(ViewState.CLIENT_TRIBO)} 
                    delay={300}
                />
             </div>
        </div>

    </div>
  );
};
