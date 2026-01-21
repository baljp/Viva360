
import React, { useState, useEffect } from 'react';
import { ViewState, Appointment, Professional, User } from '../types';
import { Video, Mic, MicOff, VideoOff, X, FileText, User as UserIcon, Clock, ChevronLeft, Heart, Sparkles, MessageSquare, ShieldCheck, Share2, Wind, Ticket, History, Calendar as CalendarIcon, Tag, Wallet } from 'lucide-react';
import { api } from '../services/api';
import { DynamicAvatar, OrganicSkeleton, Card } from '../components/Common';

export const OrdersListView: React.FC<{ user: User, onBack: () => void, setView: (v: ViewState) => void }> = ({ user, onBack, setView }) => {
  const [activeTab, setActiveTab] = useState<'rituais' | 'vouchers' | 'historico'>('rituais');
  const [items, setItems] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.appointments.list(user.id, user.role).then(data => {
        setItems(data);
        setIsLoading(false);
    });
  }, [user.id, activeTab]);

  return (
    <div className="h-full flex flex-col pb-40 animate-in slide-in-from-right pt-4 px-2 overflow-y-auto no-scrollbar">
       <header className="flex items-center gap-4 mb-8 flex-none px-4">
          <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-nature-100 text-nature-300 active:scale-90 transition-all"><ChevronLeft size={20}/></button>
          <div><h2 className="text-2xl font-serif italic text-nature-900 leading-tight">Meus Ativos</h2><p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1">Sua jornada materializada</p></div>
       </header>

       <div className="flex gap-2 px-4 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'rituais', label: 'Rituais', icon: Heart },
            { id: 'vouchers', label: 'Vouchers', icon: Ticket },
            { id: 'historico', label: 'Histórico', icon: History }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-nature-900 text-white shadow-xl' : 'bg-white text-nature-400 border border-nature-100'}`}>
              <tab.icon size={14}/> {tab.label}
            </button>
          ))}
       </div>

       <div className="space-y-4 px-4 flex-1">
          {isLoading ? (
            <div className="space-y-4"><OrganicSkeleton className="h-32 w-full" /><OrganicSkeleton className="h-32 w-full" /></div>
          ) : (
            <>
              {activeTab === 'rituais' && (
                items.filter(a => a.status === 'confirmed').length > 0 ? (
                    items.filter(a => a.status === 'confirmed').map(apt => (
                        <Card key={apt.id} className="space-y-4 group border-primary-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-primary-50 rounded-bl-[40px] flex items-center justify-center text-primary-600"><CalendarIcon size={16}/></div>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center"><Heart size={24}/></div>
                                    <div><h4 className="font-bold text-nature-900 text-sm">{apt.serviceName}</h4><p className="text-[10px] text-nature-400 font-bold uppercase mt-0.5">{apt.professionalName}</p></div>
                                </div>
                                <span className="text-[8px] px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-bold uppercase tracking-widest animate-pulse">Agendado</span>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-nature-50">
                                <div className="flex items-center gap-3 text-[10px] font-bold text-nature-400 uppercase"><Clock size={12}/> {apt.time} • Sala Virtual</div>
                                <button onClick={() => setView(ViewState.CLIENT_VIDEO_SESSION)} className="px-6 py-2 bg-nature-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all">Conectar</button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="p-12 text-center space-y-4 opacity-40"><Heart size={48} className="mx-auto" /><p className="text-sm italic">Nenhum ritual agendado no momento.</p></div>
                )
              )}

              {activeTab === 'vouchers' && (
                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                        <Tag size={100} className="absolute -right-5 -bottom-5 opacity-10 rotate-12" />
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="space-y-1"><p className="text-[8px] font-bold uppercase tracking-widest opacity-80">CÓDIGO: VIVA2024</p><h4 className="text-2xl font-serif italic">R$ 50 OFF</h4><p className="text-[10px] uppercase font-bold tracking-tighter">Em qualquer ritual de Reiki</p></div>
                            <div className="p-3 bg-white/20 rounded-2xl"><Ticket size={24}/></div>
                        </div>
                    </div>
                </div>
              )}

              {activeTab === 'historico' && (
                items.filter(a => a.status === 'completed').length > 0 ? (
                    items.filter(a => a.status === 'completed').map(apt => (
                        <div key={apt.id} className="p-6 bg-white border border-nature-50 rounded-[2rem] flex justify-between items-center opacity-80 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-nature-50 rounded-xl text-nature-400"><ShieldCheck size={18}/></div>
                                <div className="space-y-0.5"><h4 className="font-bold text-nature-800 text-xs">{apt.serviceName}</h4><p className="text-[9px] text-nature-400 font-bold uppercase">{new Date(apt.date).toLocaleDateString()}</p></div>
                            </div>
                            <div className="text-right"><span className="text-xs font-bold text-nature-900 leading-none">R$ {apt.price}</span><p className="text-[8px] text-emerald-500 font-bold uppercase">Pago</p></div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center space-y-4 opacity-40"><History size={48} className="mx-auto" /><p className="text-sm italic">Seu histórico de cura está em branco.</p></div>
                )
              )}
            </>
          )}
       </div>
    </div>
  );
};

export const VideoSessionView: React.FC<{ appointment: Appointment, onEnd: () => void }> = ({ appointment, onEnd }) => {
  const [sessionState, setSessionState] = useState<'breathing' | 'connected'>('breathing');
  const [breathCount, setBreathCount] = useState(5);

  useEffect(() => {
    if (sessionState === 'breathing') {
        const interval = setInterval(() => {
            setBreathCount(prev => {
                if (prev <= 1) { clearInterval(interval); setSessionState('connected'); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [sessionState]);

  if (sessionState === 'breathing') {
      return (
          <div className="fixed inset-0 z-[300] bg-nature-900 flex flex-col items-center justify-center p-8 text-center">
              <div className="relative mb-12">
                  <div className="absolute inset-0 bg-primary-500/20 blur-[60px] rounded-full animate-pulse"></div>
                  <div className="w-48 h-48 bg-nature-800 rounded-full border border-nature-700 flex items-center justify-center relative z-10 shadow-2xl">
                      <Wind size={64} className="text-primary-300 animate-breathe" />
                  </div>
              </div>
              <h2 className="text-3xl font-serif italic text-white mb-4">Aterre sua energia...</h2>
              <p className="text-nature-400 text-sm max-w-xs mx-auto italic leading-relaxed">Respire fundo. Preparando o espaço sagrado para sua conexão com o Guardião.</p>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[300] bg-nature-900 flex flex-col animate-in zoom-in duration-500">
      <div className="flex-1 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000" className="w-full h-full object-cover opacity-70" />
        <div className="absolute top-12 left-8 z-20 flex items-center gap-4">
           <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20"><Heart size={20} className="text-rose-400" /></div>
           <div><h3 className="text-white font-serif italic text-lg leading-none">{appointment.professionalName || "Guardião Viva"}</h3><p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Sessão em Fluxo</p></div>
        </div>
      </div>
      <div className="h-32 bg-nature-900/90 border-t border-white/10 flex items-center justify-center px-8 flex-none gap-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <button className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center border border-white/10"><Mic size={24}/></button>
        <button className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center border border-white/10"><Video size={24}/></button>
        <button onClick={onEnd} className="px-10 h-14 bg-rose-600 text-white rounded-[2rem] font-bold uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Encerrar Ritual</button>
      </div>
    </div>
  );
};
