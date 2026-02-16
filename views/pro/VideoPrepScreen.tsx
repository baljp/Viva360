import React from 'react';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';
import { Video, MessageCircle, Shield, ChevronLeft, Clock, User, Star } from 'lucide-react';
import { PortalView } from '../../components/Common';

export const VideoPrepScreen: React.FC = () => {
    const { state, go, back, notify } = useGuardiaoFlow();
    const apt = state.selectedAppointment;

    if (!apt) {
        return (
            <PortalView title="Preparação" subtitle="SESSÃO DE LUZ" onBack={back}>
                <div className="flex flex-col items-center justify-center h-64 opacity-50 italic text-nature-400">
                    Nenhuma sessão selecionada.
                </div>
            </PortalView>
        );
    }

    const startWhatsApp = () => {
        const rawPhone = String((apt as any)?.clientPhone || (apt as any)?.client_phone || (apt as any)?.phone || '');
        const phone = rawPhone.replace(/\D/g, '');
        if (!phone) {
            notify('WhatsApp indisponível', 'Este agendamento não possui telefone cadastrado.', 'warning');
            return;
        }
        const text = encodeURIComponent(`Olá ${apt.clientName}, estou iniciando nossa sessão de ${apt.serviceName} via Viva360. Podemos começar?`);
        const url = `https://wa.me/${phone}?text=${text}`;
        
        notify('Iniciando WhatsApp', 'Abrindo conversa externa...', 'info');
        
        setTimeout(() => {
            window.open(url, '_blank');
            // stay in prep or go to dashboard
            go('DASHBOARD');
        }, 1500);
    };

    return (
        <PortalView title="Preparação" subtitle="SESSÃO DE LUZ" onBack={back} heroImage="https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=800">
            <div className="px-6 pt-8 pb-32 space-y-8">
                
                {/* Appointment Detail Card */}
                <div className="bg-white p-8 rounded-[3rem] border border-nature-100 shadow-xl shadow-nature-900/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Video size={80} />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-primary-50 rounded-3xl flex items-center justify-center text-primary-600 text-2xl font-bold italic font-serif">
                            {apt.clientName?.charAt(0) || 'C'}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-nature-900">{apt.clientName}</h3>
                            <p className="text-xs text-nature-400 font-bold uppercase tracking-widest">{apt.serviceName}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-nature-50">
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-nature-300" />
                            <span className="text-sm font-bold text-nature-700">{apt.time || '14:00'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Shield size={16} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sessão Segura</span>
                        </div>
                    </div>
                </div>

                {/* Platform Selection */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-nature-400 uppercase tracking-[0.2em] ml-2">Escolha o Portal</h4>
                    
                    <button 
                        onClick={() => go('VIDEO_SESSION')}
                        className="w-full p-8 bg-nature-900 text-white rounded-[2.5rem] flex items-center justify-between group active:scale-[0.98] transition-all shadow-2xl shadow-nature-900/20"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                                <Video size={28} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-lg">Santuário Virtual</h4>
                                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Plataforma Nativa Segura</p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                        </div>
                    </button>

                    <button 
                        onClick={startWhatsApp}
                        className="w-full p-8 bg-white border border-nature-100 rounded-[2.5rem] flex items-center justify-between group active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                <MessageCircle size={28} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-lg text-nature-900">WhatsApp</h4>
                                <p className="text-[10px] text-nature-400 uppercase font-black tracking-widest">Conversa Externa</p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Reminder */}
                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 italic text-[11px] text-amber-700 leading-relaxed text-center">
                    "Que a luz guie sua palavra e seu silêncio durante este encontro sagrado."
                </div>

            </div>
        </PortalView>
    );
};
