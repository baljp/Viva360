
import React, { useState, useEffect } from 'react';
import { ViewState, Appointment, Professional, User } from '../types';
import { Video, Mic, MicOff, VideoOff, X, FileText, User as UserIcon, Clock, ChevronLeft, Heart, Sparkles, MessageSquare, ShieldCheck, Share2, Wind, Ticket, History, Calendar as CalendarIcon, Tag, Wallet, Timer, ArrowUpRight, PlayCircle } from 'lucide-react';
import { api } from '../services/api';
import { DynamicAvatar, OrganicSkeleton, Card, PortalView } from '../components/Common';
import { useGuardiaoFlow } from '../src/flow/GuardiaoFlowContext'; 
import { useOrdersList } from '../src/hooks/useOrdersList';

// Fix: Added missing VideoSessionView component for tele-health ritual sessions
export const VideoSessionView: React.FC<{ appointment?: Appointment, onEnd?: () => void, flow?: any }> = ({ appointment, onEnd, flow }) => {
  let contextApt = null;
  try {
      const guardiaoFlow = (useGuardiaoFlow as any)();
      contextApt = guardiaoFlow?.state?.selectedAppointment;
  } catch (e) {
      // Not in Guardiao flow, ignore
  }
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showNotes, setShowNotes] = useState(false);

  // Mock Data if appointment is missing
  // Mock Data if appointment is missing (Logic for when accessed via go('VIDEO_SESSION') without props)
  const activeAppointment: any = appointment || contextApt || flow?.state?.selectedAppointment || {
     serviceName: 'Sessão de Cura (Mock)',
     clientName: 'Buscador de Luz',
     professionalName: 'Guardião da Luz',
     date: new Date().toISOString(),
     startTime: new Date().toISOString(), 
     status: 'in_progress'
  };

  const handleEnd = onEnd || (() => {
      // If no onEnd provided, try to go back using history or window
      window.history.back();
  });

  return (
    <div className="fixed inset-0 z-[500] bg-nature-900 flex flex-col animate-in fade-in duration-500 h-full w-full">
      {/* Top Header */}
      <div className="flex-none p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] flex items-center justify-between text-white bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center font-serif text-xl italic shadow-lg">V</div>
           <div>
              <h3 className="font-bold text-sm">{activeAppointment.serviceName || 'Ritual de Cura'}</h3>
              <p className="text-[10px] text-primary-300 font-bold uppercase tracking-widest flex items-center gap-1.5"><Timer size={10} className="animate-pulse" /> Sessão em curso</p>
           </div>
        </div>
        <button onClick={() => setShowNotes(!showNotes)} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10"><FileText size={20}/></button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative flex flex-col lg:flex-row gap-4 p-4 lg:p-8 overflow-hidden bg-nature-950">
        {/* Main View (Professional) */}
        <div className="flex-1 bg-nature-900 rounded-[3rem] overflow-hidden relative shadow-2xl flex items-center justify-center">
           <img 
             src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200" 
             crossOrigin="anonymous"
             onError={(e) => { e.currentTarget.src = 'https://placehold.co/1200x800/1a211d/FFF?text=Stream+Offline'; }}
             className="w-full h-full object-cover opacity-80 absolute inset-0" 
             alt="Stream"
           />
           <div className="absolute bottom-6 left-6 flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
              <span className="text-xs font-bold text-white">{activeAppointment.professionalName || 'Guardião'}</span>
           </div>
        </div>

        {/* Self View Overlay */}
        <div className="w-32 h-48 lg:w-48 lg:h-64 bg-nature-900 rounded-[2rem] overflow-hidden absolute bottom-24 right-8 lg:bottom-12 lg:right-12 shadow-2xl border-2 border-white/20 z-10 flex items-center justify-center">
            {isVideoOn ? (
                <div className="w-full h-full bg-primary-900/20 animate-pulse flex items-center justify-center text-primary-500">
                    <Wind size={48} className="animate-spin-slow" />
                </div>
            ) : (
                <VideoOff size={32} className="text-nature-400" />
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg">
                <span className="text-[8px] font-bold text-white uppercase tracking-widest">Você</span>
            </div>
        </div>
      </div>

      {/* Interaction Controls */}
      <div className="flex-none p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] flex justify-center items-center gap-6 relative z-20 bg-nature-900/50 backdrop-blur-md">
        <button onClick={() => setIsMicOn(!isMicOn)} className={`p-5 rounded-full shadow-xl transition-all active:scale-90 ${isMicOn ? 'bg-white/10 text-white border border-white/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
          {isMicOn ? <Mic size={24}/> : <MicOff size={24}/>}
        </button>
        <button onClick={handleEnd} className="w-20 h-20 bg-rose-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-rose-600/30 active:scale-90 transition-all hover:bg-rose-700">
          <X size={32} strokeWidth={3} />
        </button>
        <button onClick={() => setIsVideoOn(!isVideoOn)} className={`p-5 rounded-full shadow-xl transition-all active:scale-90 ${isVideoOn ? 'bg-white/10 text-white border border-white/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}>
          {isVideoOn ? <Video size={24}/> : <VideoOff size={24}/>}
        </button>
      </div>

      {/* Private Notes Panel */}
      {showNotes && (
        <div className="absolute top-24 right-6 bottom-32 w-80 bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl p-8 border border-white/20 z-30 animate-in slide-in-from-right duration-300">
           <div className="flex justify-between items-center mb-6">
              <h4 className="font-serif italic text-xl text-nature-900">Bloco de Luz</h4>
              <button onClick={() => setShowNotes(false)} className="p-2 bg-nature-50 rounded-xl text-nature-300"><X size={16}/></button>
           </div>
           <textarea 
             placeholder="Anote seus insights aqui..." 
             className="w-full h-[calc(100%-4rem)] bg-transparent border-none resize-none focus:ring-0 text-sm italic leading-relaxed text-nature-700"
           />
        </div>
      )}
    </div>
  );
};

export const OrdersListView: React.FC<{ user: User, onBack: () => void, setView: (v: ViewState) => void }> = ({ user, onBack, setView }) => {
  const { state, actions } = useOrdersList(user);
  const { activeTab, items, isLoading } = state;
  const { setActiveTab } = actions;

  return (
    <PortalView 
        title="Cofre Sagrado" 
        subtitle="GESTÃO DE ATIVOS" 
        onBack={onBack} 
        heroImage="https://images.unsplash.com/photo-1518609878319-a16322081109?q=80&w=800"
    >

       <div className="flex gap-2 px-4 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'rituais', label: 'Rituais', icon: Heart },
            { id: 'vouchers', label: 'Vouchers', icon: Ticket },
            { id: 'historico', label: 'Histórico', icon: History }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 ${activeTab === tab.id ? 'bg-nature-900 text-white shadow-xl' : 'bg-white text-nature-400 border border-nature-100'}`}>
              <tab.icon size={16}/> {tab.label}
            </button>
          ))}
       </div>

       <div className="space-y-6 px-4 flex-1">
          {isLoading ? (
            <div className="space-y-4"><OrganicSkeleton className="h-40 w-full" /><OrganicSkeleton className="h-40 w-full" /></div>
          ) : (
            <>
              {activeTab === 'rituais' && (
                items.filter(a => a.status === 'confirmed').length > 0 ? (
                    items.filter(a => a.status === 'confirmed').map(apt => (
                        <div key={apt.id} className="bg-white p-8 rounded-[3.5rem] border border-primary-100 shadow-sm space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-[60px] flex items-center justify-center text-primary-300 opacity-40"><CalendarIcon size={40}/></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-3xl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform"><Heart size={32}/></div>
                                    <div>
                                       <h4 className="font-bold text-nature-900 text-base">{apt.serviceName}</h4>
                                       <p className="text-[10px] text-nature-400 font-bold uppercase mt-1">Guardião: {apt.professionalName}</p>
                                    </div>
                                </div>
                                <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse border border-emerald-100">Ativo</div>
                            </div>
                            <div className="pt-6 border-t border-nature-50 flex items-center justify-between">
                                <div className="space-y-1">
                                   <p className="text-[10px] font-bold text-nature-400 uppercase tracking-widest flex items-center gap-1.5"><Timer size={14}/> Inicia em 45min</p>
                                   <p className="text-[11px] text-nature-900 font-bold uppercase">{new Date(apt.date).toLocaleDateString()} • {apt.time}</p>
                                </div>
                                <button onClick={() => setView(ViewState.CLIENT_VIDEO_SESSION)} className="p-5 bg-nature-900 text-white rounded-full shadow-2xl active:scale-90 transition-all hover:bg-black"><PlayCircle size={24}/></button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center space-y-4 opacity-30"><Heart size={60} className="mx-auto" /><p className="italic text-sm">O silêncio do cofre... <br/>Nenhum ritual agendado.</p></div>
                )
              )}

              {activeTab === 'vouchers' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                        <Tag size={120} className="absolute -left-10 -bottom-10 opacity-10 rotate-12" />
                        <div className="relative z-10 flex justify-between items-start mb-10">
                            <div className="space-y-2">
                               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-100">CÓDIGO: VIVA2024</p>
                               <h4 className="text-4xl font-serif italic leading-none">R$ 50 OFF</h4>
                               <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-2">Em Rituais de Reiki</p>
                            </div>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20"><Ticket size={32}/></div>
                        </div>
                        <button className="w-full py-4 bg-white text-amber-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl">Copiar Chave</button>
                    </div>
                </div>
              )}

              {activeTab === 'historico' && (
                <div className="space-y-3">
                   {items.filter(a => a.status === 'completed').map(apt => (
                        <div key={apt.id} className="p-6 bg-white border border-nature-100 rounded-[2.5rem] flex justify-between items-center group active:scale-[0.98] transition-all">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-nature-50 text-nature-300 rounded-2xl group-hover:bg-primary-50 group-hover:text-primary-600 transition-all"><ShieldCheck size={20}/></div>
                                <div><h4 className="font-bold text-nature-800 text-sm">{apt.serviceName}</h4><p className="text-[10px] text-nature-400 font-bold uppercase mt-1">{new Date(apt.date).toLocaleDateString()}</p></div>
                            </div>
                            <div className="text-right"><span className="text-sm font-bold text-nature-900 leading-none">R$ {apt.price}</span><p className="text-[9px] text-emerald-500 font-bold uppercase mt-1">Concluído</p></div>
                        </div>
                    ))}
                </div>
              )}
            </>
          )}
       </div>
    </PortalView>
  );
};
