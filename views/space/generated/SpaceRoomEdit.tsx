import React, { useState } from 'react';
import { useSantuarioFlow } from '../../src/flow/SantuarioFlowContext';
import { PortalView, ZenToast } from '../../components/Common';
import { Save, Trash2, Camera, UploadCloud } from 'lucide-react';

export default function SpaceRoomEdit() {
    const { back, go } = useSantuarioFlow();
    const [toast, setToast] = useState<{title: string, message: string, type?: 'success'|'info'} | null>(null);

    // Mock initial data
    const [formData, setFormData] = useState({
        name: 'Sala Cristal',
        capacity: 15,
        description: 'Sala com iluminação natural e cristais energizados para sessões de cura e reiki.',
        status: 'active'
    });

    const handleSave = () => {
        // Mock API call
        setToast({ title: 'Altar Atualizado', message: 'As alterações foram salvas na egrégora.', type: 'success' });
        setTimeout(() => go('ROOMS_STATUS'), 1500);
    };

    return (
        <PortalView 
            title="Editar Altar" 
            subtitle="GESTÃO FÍSICA" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=800"
        >
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
            <div className="space-y-6 px-4 pb-24">
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm text-center relative overflow-hidden group">
                    <img src="https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=800" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"/>
                    <div className="absolute inset-0 bg-nature-900/30"></div>
                    <div className="relative z-10 py-8">
                        <button className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 mx-auto hover:bg-white/30 transition-all">
                            <Camera size={16}/> Alterar Foto
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Nome do Espaço</label>
                        <input 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-serif text-lg text-nature-900"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Capacidade</label>
                            <input 
                                type="number"
                                value={formData.capacity}
                                onChange={e => setFormData({...formData, capacity: Number(e.target.value)})}
                                className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 outline-none transition-all font-bold text-nature-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Status</label>
                            <select 
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value})}
                                className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 outline-none transition-all text-sm font-bold text-nature-700"
                            >
                                <option value="active">Ativo (Livre)</option>
                                <option value="maintenance">Manutenção</option>
                                <option value="inactive">Inativo</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Descrição</label>
                        <textarea 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full p-5 bg-white border border-nature-100 rounded-2xl h-32 resize-none focus:border-indigo-300 outline-none transition-all text-sm leading-relaxed text-nature-600"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                     <button className="p-5 bg-rose-50 text-rose-500 rounded-[2rem] hover:bg-rose-100 transition-colors">
                        <Trash2 size={24} />
                    </button>
                    <button onClick={handleSave} className="flex-1 py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                        <Save size={20} /> Salvar Alterações
                    </button>
                </div>
            </div>
        </PortalView>
    );
}
