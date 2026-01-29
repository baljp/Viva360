import React, { useState } from 'react';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';
import { PortalView, ZenToast } from '../../components/Common';
import { Zap, Send, Shield, Crown, AlertOctagon } from 'lucide-react';

export default function SpaceSummon() {
    const { back, go } = useSantuarioFlow();
    const [target, setTarget] = useState<'guardians' | 'masters'>('guardians');
    const [urgency, setUrgency] = useState<'normal' | 'high'>('normal');
    const [message, setMessage] = useState('');
    const [toast, setToast] = useState<{title: string, message: string, type?: 'success' | 'info'} | null>(null);

    const handleSend = () => {
        setToast({ 
            title: 'Convocação Enviada!', 
            message: `Alerta enviado para ${target === 'guardians' ? 'Guardiões' : 'Mestres'} disponíveis.`, 
            type: 'success' 
        });
        setTimeout(() => go('PROS_LIST'), 2000);
    };

    return (
        <PortalView 
            title="Convocar Círculo" 
            subtitle="ALERTA RÁPIDO" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1517677208171-0bc5e25bb3ca?q=80&w=800"
        >
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}

            <div className="px-4 pb-24 space-y-6">
                
                {/* Target Selection */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                    <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-4">Quem você precisa?</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setTarget('guardians')}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${target === 'guardians' ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-nature-100'}`}
                        >
                            <Shield size={24} className={target === 'guardians' ? 'text-indigo-600' : 'text-nature-300'} />
                            <span className={`text-xs font-bold uppercase ${target === 'guardians' ? 'text-indigo-900' : 'text-nature-500'}`}>Guardiões</span>
                        </button>
                        <button 
                            onClick={() => setTarget('masters')}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 ${target === 'masters' ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500' : 'bg-white border-nature-100'}`}
                        >
                            <Crown size={24} className={target === 'masters' ? 'text-amber-600' : 'text-nature-300'} />
                            <span className={`text-xs font-bold uppercase ${target === 'masters' ? 'text-amber-900' : 'text-nature-500'}`}>Mestres</span>
                        </button>
                    </div>
                </div>

                {/* Urgency */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                    <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-4">Urgência</h3>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setUrgency('normal')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${urgency === 'normal' ? 'bg-nature-900 text-white border-nature-900' : 'bg-white text-nature-400 border-nature-100'}`}
                        >
                            Normal
                        </button>
                        <button 
                            onClick={() => setUrgency('high')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${urgency === 'high' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-400 border-rose-100'}`}
                        >
                            <AlertOctagon size={14}/> Alta
                        </button>
                    </div>
                </div>

                {/* Message */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm">
                    <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-4">Mensagem</h3>
                     <textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Descreva brevemente a situação..."
                        className="w-full h-32 p-4 bg-nature-50 rounded-2xl border border-transparent focus:border-indigo-300 focus:bg-white outline-none transition-all text-sm text-nature-700 resize-none"
                    />
                </div>

                <button 
                    onClick={handleSend}
                    className={`w-full py-5 rounded-[2rem] font-bold uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 text-white ${urgency === 'high' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    <Send size={18} /> Enviar Convocação
                </button>

            </div>
        </PortalView>
    );
}
