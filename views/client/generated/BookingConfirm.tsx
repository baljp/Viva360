
import React, { useState } from 'react';
import { useBuscadorFlow } from '../../../src/flow/BuscadorFlowContext';
import { Check, Calendar, Clock, MapPin, Sparkles, Smartphone, Loader2 } from 'lucide-react';
import { PortalView, DynamicAvatar, ZenToast } from '../../../components/Common';
import { api } from '../../../services/api';

export default function BookingConfirm({ onClose }: { onClose?: () => void }) {
  const { state, go, back, reset } = useBuscadorFlow();
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{title: string, message: string} | null>(null);
  
  // Find selected professional
  const pro = state.data.pros.find(p => p.id === state.selectedProfessionalId);
  
  // Logic for dynamic date
  const dateStr = (state.selectedDate || new Date()).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const timeStr = "14:30 - 15:30"; 

  const handleSyncCalendar = () => {
    (async () => {
      setIsSyncing(true);
      try {
        const sync = await api.spaces.syncCalendar();
        const icsContent = String(sync?.data || '').trim();
        if (!icsContent) {
          throw new Error('Agenda vazia para sincronização.');
        }
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = String(sync?.filename || 'viva360-calendar.ics');
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setToast({ title: "Sincronizado", message: "Arquivo da agenda gerado para importar no celular ou desktop." });
      } catch (error: any) {
        setToast({ title: "Falha na sincronização", message: error?.message || "Não foi possível sincronizar sua agenda agora." });
      } finally {
        setIsSyncing(false);
      }
    })();
  };

  const handleGoToCheckout = () => {
    // We don't reset here yet because checkout is part of the flow
    go('CHECKOUT');
  };

  const handleClose = () => {
    if (onClose) {
        onClose();
    } else {
        reset();
    }
  };

  return (
    <PortalView 
        title="Confirmar Agendamento" 
        subtitle="REVISAR DETALHES" 
        onBack={back} 
        onClose={handleClose}
        footer={(
          <div className="flex flex-col gap-3">
              <button 
                onClick={handleGoToCheckout} 
                className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all"
              >
                <Check size={18} /> Seguir com Oferenda
              </button>
              <button 
                onClick={back} 
                className="w-full py-3 text-nature-400 font-bold uppercase text-[9px] tracking-widest transition-all hover:text-nature-600"
              >
                Revisar Horário
              </button>
          </div>
        )}
    >
      {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col items-center animate-in fade-in duration-500 pb-8">
         {/* Guardian Preview */}
         <div className="w-full flex flex-col items-center mb-8">
            <DynamicAvatar user={pro} size="lg" className="border-4 border-white shadow-lg mb-4" />
            <h3 className="text-xl font-serif italic text-nature-900">{pro?.name || 'Guardião'}</h3>
            <p className="text-[10px] text-nature-400 font-bold uppercase tracking-widest mt-1">{(pro?.specialty || []).join(' • ')}</p>
         </div>

         <div className="w-full space-y-4 px-2">
            <div className="flex items-center gap-4 p-5 bg-white/80 backdrop-blur-md rounded-3xl border border-nature-100 shadow-sm relative group overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-nature-50 flex items-center justify-center text-nature-600 transition-transform group-hover:scale-110">
                    <Calendar size={22} />
                </div>
                <div className="flex-1">
                    <p className="text-[9px] font-black text-nature-400 uppercase tracking-widest">Data Sugerida</p>
                    <p className="font-bold text-nature-900 capitalize">{dateStr}</p>
                </div>
                <button 
                    onClick={handleSyncCalendar}
                    disabled={isSyncing}
                    className={`p-3 rounded-2xl border transition-all ${isSyncing ? 'bg-nature-900 text-white animate-pulse' : 'bg-nature-50 text-nature-400 hover:bg-nature-900 hover:text-white'}`}
                >
                    {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
                </button>
            </div>

            <div className="flex items-center gap-4 p-5 bg-white/80 backdrop-blur-md rounded-3xl border border-nature-100 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Clock size={22} />
                </div>
                <div>
                    <p className="text-[9px] font-black text-nature-400 uppercase tracking-widest">Janela de Tempo</p>
                    <p className="font-bold text-nature-900">{timeStr}</p>
                </div>
            </div>

            <div className="flex items-center gap-4 p-5 bg-white/80 backdrop-blur-md rounded-3xl border border-nature-100 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <MapPin size={22} />
                </div>
                <div>
                    <p className="text-[9px] font-black text-nature-400 uppercase tracking-widest">Localização</p>
                    <p className="font-bold text-nature-900">Santuário Gaia / Online</p>
                </div>
            </div>

            <div className="p-6 bg-nature-900/5 rounded-[2rem] border border-nature-900/10 mt-6 mb-4">
                <div className="flex items-center gap-2 mb-2 text-nature-800">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sincronização Viva</span>
                </div>
                <p className="text-xs text-nature-500 leading-relaxed italic">"Ao confirmar, este portal de cura será aberto em sua realidade e sincronizado com seu calendário pessoal."</p>
            </div>
         </div>
      </div>
    </PortalView>
  );
}
