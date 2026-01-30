import React, { useState } from 'react';
import { User } from '../../types';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';
import { ArrowLeft, Plus, Sparkles, Layout, Users, Wind, Sun, Moon } from 'lucide-react';

export const SpaceRoomCreate: React.FC<{ user: User }> = ({ user }) => {
    const { go, notify } = useSantuarioFlow();
    const [name, setName] = useState('');
    const [type, setType] = useState('healing');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name) return notify('Nome Necessário', 'Dê um nome ao seu novo altar.', 'warning');
        
        setLoading(true);
        // Simulating API 
        setTimeout(() => {
            setLoading(false);
            notify('Altar Consagrado', `O espaço "${name}" foi ativado com sucesso.`, 'success');
            go('ROOMS_STATUS');
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-[#fcfdfc] relative animate-in slide-in-from-right duration-500">
             {/* Header */}
             <div className="px-6 py-8 flex items-center gap-4">
                <button onClick={() => go('ROOMS_STATUS')} className="p-3 bg-white border border-nature-100 rounded-2xl text-nature-400 hover:text-nature-900 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                     <h2 className="text-2xl font-serif italic text-nature-900">Novo Altar</h2>
                     <p className="text-[10px] uppercase tracking-widest text-nature-400 font-bold">Expansão do Santuário</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-8">
                
                {/* Nome do Espaço */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-nature-900 flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-500" /> Nome do Espaço
                    </label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ex: Sala Ametista, Jardim Zen..."
                        className="w-full p-6 bg-white border border-nature-100 rounded-[2rem] text-lg font-serif italic text-nature-900 placeholder:text-nature-300 focus:outline-none focus:ring-2 focus:ring-nature-200 transition-all shadow-sm"
                    />
                </div>

                {/* Tipo de Energia (Tipo de Sala) */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-nature-900 flex items-center gap-2">
                         <Layout size={16} className="text-indigo-500" /> Propósito
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'healing', label: 'Cura & Terapia', icon: Sun, color: 'bg-amber-100 text-amber-600' },
                            { id: 'meditation', label: 'Meditação', icon: Wind, color: 'bg-indigo-100 text-indigo-600' },
                            { id: 'movement', label: 'Movimento', icon: Users, color: 'bg-emerald-100 text-emerald-600' },
                            { id: 'ritual', label: 'Rituais', icon: Moon, color: 'bg-purple-100 text-purple-600' },
                        ].map((t) => (
                            <button 
                                key={t.id}
                                onClick={() => setType(t.id)}
                                className={`p-4 rounded-3xl border transition-all flex flex-col items-center gap-3 ${type === t.id ? 'bg-nature-900 text-white border-nature-900 shadow-xl scale-[1.02]' : 'bg-white border-nature-100 text-nature-400 hover:bg-nature-50'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === t.id ? 'bg-white/20 text-white' : t.color}`}>
                                    <t.icon size={20} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info Cards Decoration */}
                <div className="bg-nature-50 p-6 rounded-[2.5rem] border border-nature-100 flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-nature-400 shadow-sm shrink-0">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-nature-900 text-sm mb-1">Consagração Digital</h4>
                        <p className="text-xs text-nature-500 leading-relaxed">
                            Ao criar este altar, ele se torna visível para Guardiões em busca de locais para atendimento. Configure a disponibilidade na agenda após a criação.
                        </p>
                    </div>
                </div>

            </div>

            {/* Footer Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-nature-100">
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Plus size={20} /> Consagrar Altar
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
