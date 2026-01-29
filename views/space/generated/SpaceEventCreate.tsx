import React, { useState } from 'react';
import { useSantuarioFlow } from '../../../src/flow/SantuarioFlowContext';
import { PortalView, ZenToast } from '../../../components/Common';
import { Calendar, MapPin, Users, Ticket, Image as ImageIcon, Save, ArrowRight } from 'lucide-react';

export default function SpaceEventCreate() {
    const { back, go } = useSantuarioFlow();
    const [step, setStep] = useState(1);
    const [eventType, setEventType] = useState('workshop'); // workshop, retreat, class

    const handleNext = () => {
        if (step < 2) setStep(step + 1);
        else {
            // Finish
            go('EXEC_DASHBOARD');
        }
    };

    return (
        <PortalView 
            title="Criar Experiência" 
            subtitle="EXPANSÃO DA CONSCIÊNCIA" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1528642474498-1af0c17fd8c3?q=80&w=800"
        >
            <div className="space-y-6 px-4 pb-24">
                
                {/* Progress */}
                <div className="flex gap-2 mb-4">
                    <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-nature-100'}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-nature-100'}`}></div>
                </div>

                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        <div className="space-y-4">
                            <h3 className="font-serif italic text-2xl text-nature-900">Tipo de Vivência</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setEventType('workshop')} className={`p-4 rounded-2xl border text-left transition-all ${eventType === 'workshop' ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-nature-100'}`}>
                                    <span className="block text-2xl mb-2">🎓</span>
                                    <h4 className="font-bold text-nature-900 text-sm">Workshop / Aula</h4>
                                    <p className="text-[9px] text-nature-500 mt-1">Atividade pontual de curda duração.</p>
                                </button>
                                <button onClick={() => setEventType('retreat')} className={`p-4 rounded-2xl border text-left transition-all ${eventType === 'retreat' ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-nature-100'}`}>
                                    <span className="block text-2xl mb-2">🌿</span>
                                    <h4 className="font-bold text-nature-900 text-sm">Retiro Imersivo</h4>
                                    <p className="text-[9px] text-nature-500 mt-1">Jornada de múltiplos dias com estadia.</p>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Nome do Evento</label>
                            <input 
                                placeholder="Ex: Círculo de Mulheres - Lua Nova"
                                className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-serif text-lg text-nature-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Facilitador(es)</label>
                            <div className="flex items-center gap-3 p-3 bg-white border border-nature-100 rounded-2xl">
                                <div className="w-8 h-8 bg-nature-100 rounded-full"></div>
                                <span className="text-sm font-bold text-nature-700">Adicionar Guardião...</span>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Quando?</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white border border-nature-100 rounded-2xl flex items-center gap-3">
                                    <Calendar className="text-indigo-400" size={20}/>
                                    <span className="text-sm font-bold text-nature-700">Data Início</span>
                                </div>
                                <div className="p-4 bg-white border border-nature-100 rounded-2xl flex items-center gap-3">
                                    <Users className="text-indigo-400" size={20}/>
                                    <input type="number" placeholder="Vagas" className="w-full outline-none font-bold text-nature-700 bg-transparent"/>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Onde?</label>
                            <select className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 outline-none font-bold text-nature-700">
                                <option>Sala Cristal</option>
                                <option>Templo Solar</option>
                                <option>Jardim Externo</option>
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Valor de Troca</label>
                            <div className="p-5 bg-white border border-nature-100 rounded-2xl flex items-center gap-3">
                                <Ticket className="text-emerald-500" size={20}/>
                                <span className="font-bold text-nature-900">R$</span>
                                <input type="number" placeholder="0,00" className="w-full outline-none text-lg font-bold text-nature-900 bg-transparent"/>
                            </div>
                        </div>
                    </div>
                )}

                <button onClick={handleNext} className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 mt-8">
                    {step === 2 ? 'Publicar Vivência' : 'Continuar'} <ArrowRight size={20} />
                </button>
            </div>
        </PortalView>
    );    
}
