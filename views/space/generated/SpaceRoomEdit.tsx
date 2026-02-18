import React, { useEffect, useRef, useState } from 'react';
import { useSantuarioFlow } from '../../../src/flow/SantuarioFlowContext';
import { PortalView } from '../../../components/Common';
import { Save, Trash2, Camera, UploadCloud } from 'lucide-react';
import { api } from '../../../services/api';

export default function SpaceRoomEdit() {
    const { state, back, go, notify} = useSantuarioFlow();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const selectedRoom = state.data.rooms?.find((r: any) => r.id === state.selectedRoomId) || null;
    const initialImage = selectedRoom?.imageUrl || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=800';
    const [imagePreview, setImagePreview] = useState<string>(initialImage);

    const [formData, setFormData] = useState({
        name: selectedRoom?.name || 'Altar',
        capacity: selectedRoom?.capacity || 10,
        description: selectedRoom?.description || 'Descreva o campo e o propósito do altar.',
        status: String(selectedRoom?.status || 'available'),
    });

    useEffect(() => {
        if (!selectedRoom) return;
        setFormData({
            name: selectedRoom.name || 'Altar',
            capacity: selectedRoom.capacity || 10,
            description: selectedRoom.description || 'Descreva o campo e o propósito do altar.',
            status: String(selectedRoom.status || 'available'),
        });
        setImagePreview(selectedRoom.imageUrl || initialImage);
    }, [state.selectedRoomId]);

    const handleSave = () => {
        const id = state.selectedRoomId;
        if (!id) {
            notify('Selecione um Altar', 'Volte e escolha um altar para editar.', 'info');
            return;
        }
        setIsSaving(true);
        (async () => {
            try {
                const payload: any = {
                    name: formData.name,
                    capacity: Number(formData.capacity || 10),
                    status: formData.status,
                    description: formData.description,
                };
                // Only send base64 if user actually changed it and we have a data URL.
                if (imagePreview && imagePreview.startsWith('data:')) {
                    payload.imageBase64 = imagePreview;
                }
                await api.spaces.updateRoom(id, payload);
                notify('Altar Atualizado', 'As alterações foram salvas na egrégora.', 'success');
                setTimeout(() => go('ROOMS_STATUS'), 900);
            } catch (e: any) {
                notify('Falha ao salvar', e?.message || 'Não foi possível atualizar o altar.', 'error');
            } finally {
                setIsSaving(false);
            }
        })();
    };

    const handleChangePhoto = () => {
        fileInputRef.current?.click();
    };

    const handleDeleteRoom = () => {
        notify('Altar removido', 'O espaço foi removido da grade ativa.', 'info');
        setTimeout(() => go('ROOMS_STATUS'), 1500);
    };

    const resizeToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const max = 1200;
                const scale = Math.min(1, max / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas unavailable'));
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = () => reject(new Error('Invalid image'));
            img.src = String(reader.result || '');
        };
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
    });

    return (
        <PortalView 
            title="Editar Altar" 
            subtitle="GESTÃO FÍSICA" 
            onBack={back}
            heroImage={imagePreview && !imagePreview.startsWith('data:') ? imagePreview : 'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=800'}
        >
            
            <div className="space-y-6 px-4 pb-24">
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 shadow-sm text-center relative overflow-hidden group">
                    <img src={imagePreview || initialImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" alt="" />
                    <div className="absolute inset-0 bg-nature-900/30"></div>
                    <div className="relative z-10 py-8">
                        <button onClick={handleChangePhoto} className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 mx-auto hover:bg-white/30 transition-all">
                            <Camera size={16}/> Alterar Foto
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                    const dataUrl = await resizeToDataUrl(file);
                                    setImagePreview(dataUrl);
                                    notify('Imagem pronta', 'Salve para aplicar a nova foto.', 'info');
                                } catch (err: any) {
                                    notify('Falha na imagem', err?.message || 'Não foi possível carregar a foto.', 'error');
                                } finally {
                                    // Allow re-selecting the same file.
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
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
                     <button onClick={handleDeleteRoom} className="p-5 bg-rose-50 text-rose-500 rounded-[2rem] hover:bg-rose-100 transition-colors">
                        <Trash2 size={24} />
                    </button>
                    <button disabled={isSaving} onClick={handleSave} className="flex-1 py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        <Save size={20} /> Salvar Alterações
                    </button>
                </div>
            </div>
        </PortalView>
    );
}
