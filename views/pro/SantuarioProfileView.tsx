import React, { useState } from 'react';
import { User } from '../../types';
import { Building2, MapPin, Star, Clock, Users, Phone, Globe, Heart, Calendar, Shield, ChevronRight, Share2 } from 'lucide-react';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';
import { DynamicAvatar, ZenToast } from '../../components/Common';

export const SantuarioProfileView: React.FC<{ user: User }> = ({ user }) => {
    const { go, back } = useGuardiaoFlow();
    const [toast, setToast] = useState<any>(null);

    const space = {
        id: 's1',
        name: 'Espaço Gaia',
        address: 'Rua das Flores, 123 - Vila Madalena',
        city: 'São Paulo, SP',
        phone: '(11) 99876-5432',
        website: 'www.espacogaia.com.br',
        rating: 4.8,
        reviews: 127,
        hours: 'Seg-Sex: 8h-20h | Sab: 9h-14h',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800',
        description: 'Um santuário de cura integrativa no coração de São Paulo. Oferecemos espaços preparados para terapias holísticas, yoga, meditação e workshops transformadores.',
        amenities: ['Wi-Fi', 'Ar Condicionado', 'Estacionamento', 'Maca', 'Som Ambiente', 'Sala de Espera'],
        guardians: [
            { id: 'g1', name: 'Ana Luz', specialty: 'Yoga & Meditação', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=ana' },
            { id: 'g2', name: 'Carlos Paz', specialty: 'Reiki Master', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=carlos' },
            { id: 'g3', name: 'Mariana Serenidade', specialty: 'Constelação Familiar', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=mariana' },
        ],
        rooms: [
            { id: 'r1', name: 'Sala Gaia', type: 'Terapia Individual', available: true },
            { id: 'r2', name: 'Sala Shanti', type: 'Grupo (até 15)', available: true },
            { id: 'r3', name: 'Altar Zen', type: 'Meditação', available: false },
        ]
    };

    return (
        <div className="min-h-screen bg-[#f8faf9] pb-32">
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
            <div className="relative h-64">
                <img src={space.image} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <button onClick={back} className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all">←</button>
                <button onClick={() => setToast({ title: 'Link Copiado', message: 'Compartilhe este santuário', type: 'success' })} className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"><Share2 size={16} /></button>
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full text-[9px] font-black text-emerald-200 uppercase tracking-widest border border-emerald-400/30">Vínculo Ativo</span>
                    </div>
                    <h1 className="text-3xl font-serif italic text-white drop-shadow-lg">{space.name}</h1>
                    <p className="text-white/70 text-xs flex items-center gap-1 mt-1"><MapPin size={12} /> {space.address}</p>
                </div>
            </div>

            <div className="px-4 -mt-4 space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-nature-100 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1"><Star size={14} className="text-amber-400 fill-amber-400" /><span className="font-bold text-nature-900">{space.rating}</span></div>
                        <p className="text-[9px] font-bold text-nature-400 uppercase">{space.reviews} Avaliações</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-nature-100 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1"><Users size={14} className="text-indigo-500" /><span className="font-bold text-nature-900">{space.guardians.length}</span></div>
                        <p className="text-[9px] font-bold text-nature-400 uppercase">Guardiões</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-nature-100 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1"><Building2 size={14} className="text-emerald-500" /><span className="font-bold text-nature-900">{space.rooms.length}</span></div>
                        <p className="text-[9px] font-bold text-nature-400 uppercase">Altares</p>
                    </div>
                </div>

                {/* About */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                    <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-3">Sobre o Santuário</h3>
                    <p className="text-sm text-nature-700 leading-relaxed">{space.description}</p>
                </div>

                {/* Info Cards */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 space-y-4">
                    <div className="flex items-center gap-4"><Clock size={18} className="text-nature-400" /><div><p className="text-[9px] font-bold text-nature-400 uppercase">Horários</p><p className="text-sm text-nature-900 font-medium">{space.hours}</p></div></div>
                    <div className="flex items-center gap-4"><Phone size={18} className="text-nature-400" /><div><p className="text-[9px] font-bold text-nature-400 uppercase">Contato</p><p className="text-sm text-nature-900 font-medium">{space.phone}</p></div></div>
                    <div className="flex items-center gap-4"><Globe size={18} className="text-nature-400" /><div><p className="text-[9px] font-bold text-nature-400 uppercase">Website</p><p className="text-sm text-nature-900 font-medium">{space.website}</p></div></div>
                </div>

                {/* Amenities */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                    <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-3">Facilidades</h3>
                    <div className="flex flex-wrap gap-2">
                        {space.amenities.map((a, i) => (
                            <span key={i} className="px-3 py-1.5 bg-nature-50 rounded-xl text-[10px] font-bold text-nature-600">{a}</span>
                        ))}
                    </div>
                </div>

                {/* Guardians */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                    <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-4">Guardiões Residentes</h3>
                    <div className="space-y-3">
                        {space.guardians.map(g => (
                            <div key={g.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-nature-50 transition-colors">
                                <img src={g.avatar} className="w-12 h-12 rounded-xl object-cover border border-nature-100" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-nature-900 text-sm">{g.name}</h4>
                                    <p className="text-[10px] text-nature-400 font-bold uppercase">{g.specialty}</p>
                                </div>
                                <Heart size={16} className="text-nature-200" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rooms */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                    <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-4">Altares Disponíveis</h3>
                    <div className="space-y-3">
                        {space.rooms.map(r => (
                            <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl border border-nature-50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${r.available ? 'bg-emerald-500' : 'bg-nature-200'}`}></div>
                                    <div>
                                        <h4 className="font-bold text-nature-900 text-sm">{r.name}</h4>
                                        <p className="text-[10px] text-nature-400">{r.type}</p>
                                    </div>
                                </div>
                                <span className={`text-[9px] font-bold uppercase ${r.available ? 'text-emerald-600' : 'text-nature-300'}`}>{r.available ? 'Livre' : 'Ocupado'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <button onClick={() => go('SANTUARIO_CONTRACT')} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Shield size={16} /> Ver Meu Contrato
                </button>
                <button onClick={() => go('AGENDA_VIEW')} className="w-full py-4 bg-white text-nature-900 rounded-2xl font-bold uppercase tracking-widest text-xs border border-nature-200 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Calendar size={16} /> Ver Agenda neste Espaço
                </button>
            </div>
        </div>
    );
};
