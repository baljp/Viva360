import React, { useState } from 'react';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';
import { PortalView, ZenToast } from '../../components/Common';
import { Camera, Save, Plus, ArrowRight } from 'lucide-react';

export default function SpaceRoomCreate() {
    const { back, go } = useSantuarioFlow();
    const [step, setStep] = useState(1);

    return (
        <PortalView 
            title="Consagrar Altar" 
            subtitle="NOVO ESPAÇO" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1545167622-3a6ac15600f3?q=80&w=800"
        >
            <div className="space-y-6 px-4 pb-24">
                {/* Progress */}
                <div className="flex gap-2 mb-4">
                    <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-nature-100'}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-nature-100'}`}></div>
                </div>

                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        <div className="text-center space-y-2 mb-6">
                            <h3 className="font-serif italic text-2xl text-nature-900">Energia do Espaço</h3>
                            <p className="text-sm text-nature-500">Defina a identidade do novo altar.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Nome Sagrado</label>
                                <input 
                                    placeholder="Ex: Sala Ametista"
                                    className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-serif text-lg text-nature-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Propósito Principal</label>
                                <select className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 outline-none transition-all text-sm font-bold text-nature-700">
                                    <option>Terapias Individuais</option>
                                    <option>Rituais Coletivos</option>
                                    <option>Banhos & Limpeza</option>
                                    <option>Acomodação (Retiros)</option>
                                </select>
                            </div>

                             <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm text-center relative overflow-hidden group border-dashed border-2 cursor-pointer hover:bg-nature-50 transition-colors">
                                <div className="py-4">
                                    <div className="w-12 h-12 bg-nature-100 rounded-full flex items-center justify-center mx-auto mb-3 text-nature-400">
                                        <Camera size={20}/>
                                    </div>
                                    <p className="text-xs font-bold text-nature-400 uppercase tracking-widest">Adicionar Foto do Altar</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                         <div className="text-center space-y-2 mb-6">
                            <h3 className="font-serif italic text-2xl text-nature-900">Capacidade & Fluxo</h3>
                            <p className="text-sm text-nature-500">Detalhes físicos e operacionais.</p>
                        </div>

                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Capacidade</label>
                                <input 
                                    type="number"
                                    placeholder="0"
                                    className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 outline-none transition-all font-bold text-nature-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Andar/Nível</label>
                                <input 
                                    placeholder="Térreo"
                                    className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 outline-none transition-all font-bold text-nature-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Facilidades</label>
                            <div className="flex flex-wrap gap-2">
                                {['Ar Condicionado', 'Maca', 'Som', 'Iluminação', 'Tapetes', 'Banheiro'].map(f => (
                                    <button key={f} className="px-4 py-2 bg-white border border-nature-100 rounded-xl text-xs font-bold text-nature-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <button 
                    onClick={() => {
                        if (step < 2) setStep(step + 1);
                        else go('ROOMS_STATUS');
                    }} 
                    className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 mt-8"
                >
                    {step === 2 ? 'Consagrar Altar' : 'Continuar'} <ArrowRight size={20} />
                </button>
            </div>
        </PortalView>
    );
}
