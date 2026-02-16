import React, { useState } from 'react';
import { PortalView, ZenToast } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';
import { RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export const AlquimiaProposeTrade: React.FC = () => {
    const { go, back } = useGuardiaoFlow();
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);
    const [isSending, setIsSending] = useState(false);

    // Mock "My Items" to offer in trade
    const [myItems] = useState([
        { id: '1', name: 'Mentoria 1h', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4' },
        { id: '2', name: 'Mapa Astral', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765' }
    ]);

    const handlePropose = async () => {
        if (!selectedItem) {
            setToast({ title: 'Seleção Necessária', message: 'Escolha um item seu para oferecer.' });
            return;
        }
        setIsSending(true);
        try {
            await new Promise(r => setTimeout(r, 1000));
            setToast({ title: 'Proposta Enviada!', message: 'Sua troca foi enviada. Aguarde resposta.' });
            setTimeout(() => go('ESCAMBO_CONFIRM'), 1200);
        } catch (err: any) {
            setToast({ title: 'Erro', message: err.message || 'Falha ao enviar proposta. Tente novamente.' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <PortalView 
            title="Propor Troca" 
            subtitle="FLUXO DE ABUNDÂNCIA" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800"
        >
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
            <div className="space-y-8 px-2 pb-24">
                <div className="bg-nature-900 p-6 rounded-[2rem] text-white flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase opacity-70 tracking-widest mb-1">Item Desejado</p>
                        <h3 className="font-serif italic text-xl">Cristal de Quartzo Rosa</h3>
                        <p className="text-xs text-emerald-300 mt-1">por Ana Silva</p>
                    </div>
                    <div className="w-16 h-16 bg-white/10 rounded-2xl">
                        <img src="https://images.unsplash.com/photo-1602755295717-d5d143c65c08?q=80&w=200" className="w-full h-full object-cover rounded-2xl" alt="Item desejado" />
                    </div>
                </div>

                <div className="flex justify-center -my-4 relative z-10">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-[#f8faf9] text-nature-400">
                        <RefreshCw size={24} />
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest text-center">O que você oferece?</h4>
                    
                    <div className="grid grid-cols-1 gap-3">
                        {myItems.map(item => (
                            <div 
                                key={item.id}
                                onClick={() => setSelectedItem(item.id)}
                                className={`p-4 rounded-[2rem] border flex items-center gap-4 cursor-pointer transition-all ${selectedItem === item.id ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200' : 'bg-white border-nature-100'}`}
                            >
                                <img src={item.image} className="w-14 h-14 rounded-xl object-cover" alt={item.name} />
                                <div className="flex-1">
                                    <h5 className="font-bold text-nature-900">{item.name}</h5>
                                    <p className="text-[10px] text-nature-400 font-bold uppercase">Disponível</p>
                                </div>
                                {selectedItem === item.id && <CheckCircle2 className="text-indigo-500" size={24}/>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Mensagem (Opcional)</label>
                    <textarea 
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Olá, gostaria de trocar sua arte pelo meu serviço..."
                        className="w-full p-5 bg-white border border-nature-100 rounded-3xl h-24 resize-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm leading-relaxed text-nature-600"
                    />
                </div>

                <button 
                    onClick={handlePropose}
                    disabled={isSending}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-indigo-700 flex items-center justify-center gap-3 disabled:opacity-60"
                >
                    {isSending ? <span className="animate-pulse">Enviando...</span> : <>Enviar Proposta <ArrowRight size={20} /></>}
                </button>
            </div>
        </PortalView>
    );
};
