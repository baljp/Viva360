import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { Building2, MapPin, Star, Clock, Users, Phone, Globe, Heart, Calendar, Shield, Share2, Loader2, AlertCircle } from 'lucide-react';
import { useGuardiaoFlow } from '../../src/flow/useGuardiaoFlow';
import { DynamicAvatar } from '../../components/Common';
import { api } from '../../services/api';

interface SantuarioDetails {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    website: string;
    rating: number;
    reviews: number;
    hours: string;
    image: string;
    description: string;
    amenities: string[];
    guardians: Array<{ id: string; name: string; specialty: string; avatar: string }>;
    rooms: Array<{ id: string; name: string; type: string; available: boolean }>;
}

export const SantuarioProfileView: React.FC<{ user: User }> = ({ user }) => {
    const { go, back, notify, state } = useGuardiaoFlow();
    const selectedSantuario = state.selectedSantuario;

    const [space, setSpace] = useState<SantuarioDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedSantuario?.id) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                // Try to fetch full details from API
                const data = await (api.spaces as unknown as { getById?: (id: string) => Promise<SantuarioDetails | null> })?.getById?.(selectedSantuario.id).catch(() => null);
                if (!cancelled) {
                    if (data) {
                        setSpace({
                            id: data.id,
                            name: data.name || selectedSantuario.name || 'Santuário',
                            address: data.address || selectedSantuario.address || '',
                            city: data.city || selectedSantuario.city || '',
                            phone: data.phone || '',
                            website: data.website || '',
                            rating: data.rating ?? selectedSantuario.rating ?? 5.0,
                            reviews: data.reviews ?? data.review_count ?? 0,
                            hours: data.hours || 'Consulte o santuário',
                            image: data.image || data.avatar || selectedSantuario.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800',
                            description: data.description || data.bio || 'Santuário de cura integrativa.',
                            amenities: data.amenities || data.specialty || [],
                            guardians: data.guardians || [],
                            rooms: data.rooms || [],
                        });
                    } else {
                        // Graceful fallback: use what we already know from the list
                        setSpace({
                            id: selectedSantuario.id,
                            name: selectedSantuario.name || 'Santuário',
                            address: selectedSantuario.address || '',
                            city: selectedSantuario.city || '',
                            phone: '',
                            website: '',
                            rating: selectedSantuario.rating ?? 5.0,
                            reviews: 0,
                            hours: '',
                            image: selectedSantuario.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800',
                            description: selectedSantuario.description || '',
                            amenities: [],
                            guardians: [],
                            rooms: [],
                        });
                    }
                }
            } catch {
                if (!cancelled) {
                    setSpace({
                        id: selectedSantuario.id,
                        name: selectedSantuario.name || 'Santuário',
                        address: selectedSantuario.address || '',
                        city: selectedSantuario.city || '',
                        phone: '', website: '', rating: selectedSantuario.rating ?? 5.0,
                        reviews: 0, hours: '', image: selectedSantuario.image || '',
                        description: '', amenities: [], guardians: [], rooms: [],
                    });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [selectedSantuario?.id]);

    if (!selectedSantuario) {
        return (
            <div className="min-h-screen bg-nature-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-nature-100">
                    <AlertCircle size={32} className="mx-auto mb-4 text-amber-500" />
                    <h3 className="text-lg font-bold text-nature-900 mb-2">Santuário não selecionado</h3>
                    <p className="text-sm text-nature-500 mb-6">Volte à lista para selecionar um santuário.</p>
                    <button onClick={back} className="w-full py-3 bg-nature-900 text-white rounded-xl text-sm font-bold uppercase tracking-wider">
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-nature-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-nature-400">
                    <Loader2 size={28} className="animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">Carregando santuário...</span>
                </div>
            </div>
        );
    }

    if (!space) return null;

    return (
        <div className="min-h-screen bg-[#f8faf9] pb-32">
            <div className="relative h-64">
                <img src={space.image} className="w-full h-full object-cover" alt={space.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <button onClick={back} className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all">←</button>
                <button
                    onClick={() => notify('Link Copiado', `Compartilhe ${space.name}`, 'success')}
                    className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all"
                >
                    <Share2 size={16} />
                </button>
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full text-[9px] font-black text-emerald-200 uppercase tracking-widest border border-emerald-400/30">Vínculo Ativo</span>
                    </div>
                    <h1 className="text-3xl font-serif italic text-white drop-shadow-lg">{space.name}</h1>
                    {space.address && (
                        <p className="text-white/70 text-xs flex items-center gap-1 mt-1"><MapPin size={12} /> {space.address}</p>
                    )}
                </div>
            </div>

            <div className="px-4 -mt-4 space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-nature-100 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1"><Star size={14} className="text-amber-400 fill-amber-400" /><span className="font-bold text-nature-900">{space.rating.toFixed(1)}</span></div>
                        <p className="text-[9px] font-bold text-nature-400 uppercase">{space.reviews > 0 ? `${space.reviews} Avaliações` : 'Avaliações'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-nature-100 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1"><Users size={14} className="text-indigo-500" /><span className="font-bold text-nature-900">{space.guardians.length || '—'}</span></div>
                        <p className="text-[9px] font-bold text-nature-400 uppercase">Guardiões</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-nature-100 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1"><Building2 size={14} className="text-emerald-500" /><span className="font-bold text-nature-900">{space.rooms.length || '—'}</span></div>
                        <p className="text-[9px] font-bold text-nature-400 uppercase">Altares</p>
                    </div>
                </div>

                {/* About */}
                {space.description && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                        <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-3">Sobre o Santuário</h3>
                        <p className="text-sm text-nature-700 leading-relaxed">{space.description}</p>
                    </div>
                )}

                {/* Info Cards */}
                {(space.hours || space.phone || space.website) && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100 space-y-4">
                        {space.hours && <div className="flex items-center gap-4"><Clock size={18} className="text-nature-400 shrink-0" /><div><p className="text-[9px] font-bold text-nature-400 uppercase">Horários</p><p className="text-sm text-nature-900 font-medium">{space.hours}</p></div></div>}
                        {space.phone && <div className="flex items-center gap-4"><Phone size={18} className="text-nature-400 shrink-0" /><div><p className="text-[9px] font-bold text-nature-400 uppercase">Contato</p><p className="text-sm text-nature-900 font-medium">{space.phone}</p></div></div>}
                        {space.website && <div className="flex items-center gap-4"><Globe size={18} className="text-nature-400 shrink-0" /><div><p className="text-[9px] font-bold text-nature-400 uppercase">Website</p><p className="text-sm text-nature-900 font-medium">{space.website}</p></div></div>}
                    </div>
                )}

                {/* Amenities */}
                {space.amenities.length > 0 && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                        <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-3">Facilidades</h3>
                        <div className="flex flex-wrap gap-2">
                            {space.amenities.map((a, i) => (
                                <span key={i} className="px-3 py-1.5 bg-nature-50 rounded-xl text-[10px] font-bold text-nature-600">{a}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Guardians */}
                {space.guardians.length > 0 && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                        <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-4">Guardiões Residentes</h3>
                        <div className="space-y-3">
                            {space.guardians.map((g) => (
                                <div key={g.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-nature-50 transition-colors">
                                    <img src={g.avatar} className="w-12 h-12 rounded-xl object-cover border border-nature-100" alt={g.name} />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-nature-900 text-sm">{g.name}</h4>
                                        <p className="text-[10px] text-nature-400 font-bold uppercase">{g.specialty}</p>
                                    </div>
                                    <Heart size={16} className="text-nature-200" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rooms */}
                {space.rooms.length > 0 && (
                    <div className="bg-white p-6 rounded-[2.5rem] border border-nature-100">
                        <h3 className="text-xs font-bold text-nature-400 uppercase tracking-widest mb-4">Altares Disponíveis</h3>
                        <div className="space-y-3">
                            {space.rooms.map((r) => (
                                <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl border border-nature-50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${r.available ? 'bg-emerald-500' : 'bg-nature-200'}`} />
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
                )}

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
