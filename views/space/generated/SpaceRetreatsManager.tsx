import React, { useEffect, useMemo, useState } from 'react';
import { useSantuarioFlow } from '../../../src/flow/useSantuarioFlow';
import { PortalView, BottomSheet } from '../../../components/Common';
import { Calendar, Users, Plus, ArrowRight, Edit3, Trash2 } from 'lucide-react';
import { api } from '../../../services/api';

interface RetreatItem extends Record<string, unknown> {
  id?: string;
  title?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  image?: string;
  dates?: string;
  _capacity?: number;
  _enrolled?: number;
  _isRetreat?: boolean;
  details?: string;
  type?: string;
  facilitatorName?: string;
  location?: string;
  price?: number;
  status?: string;
  revenue?: string | number;
}

export default function SpaceRetreatsManager() {
    const { back, go, selectEvent, notify } = useSantuarioFlow();
    const [isLoading, setIsLoading] = useState(true);
    const [events, setEvents] = useState<any[]>([]);
    const [selected, setSelected] = useState<any | null>(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await api.spaces.getRetreats();
                if (mounted) setEvents(Array.isArray(data) ? data : []);
            } catch {
                if (mounted) setEvents([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    const retreats = useMemo(() => {
        const list = events
            .map((e: Record<string, unknown>) => {
                let meta: Record<string, unknown> = {};
                try { meta = e.details ? JSON.parse(String(e.details)) : {}; } catch { /* ignore malformed details */ }
                const rawType = String(e.type || '').toLowerCase();
                const kind = String(meta.kind || '').toLowerCase();
                const isRetreat = rawType === 'retreat' || kind === 'retreat';
                const start = e.start_time ? new Date(String(e.start_time)) : null;
                const end = e.end_time ? new Date(String(e.end_time)) : null;
                const dates = start
                    ? `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}${end ? ` - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}` : ''}`
                    : '--';
                const capacity = Number(meta.capacity || 0) || 10;
                const enrolled = Number(meta.enrolled || 0) || 0;
                const spots = `${enrolled}/${capacity}`;
                const revenue = meta.price ? `R$ ${Number(meta.price).toFixed(0)}` : 'R$ --';
                const cancelled = !!meta.cancelled || !!meta.cancelledAt;
                return {
                    id: e.id,
                    title: e.title,
                    dates,
                    spots,
                    revenue,
                    status: cancelled ? 'cancelled' : 'active',
                    image: meta.image || 'https://images.unsplash.com/photo-1545167622-3a6ac15600f3?q=80&w=600',
                    raw: e,
                    meta,
                    _isRetreat: isRetreat,
                    _enrolled: enrolled,
                    _capacity: capacity,
                };
            })
            .filter((e: Record<string, unknown>) => e._isRetreat) as RetreatItem[];
        return list;
    }, [events]);

    return (
        <PortalView
            title="Retiros"
            subtitle="JORNADAS IMERSIVAS"
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1545167622-3a6ac15600f3?q=80&w=800"
            footer={
                <button
                    onClick={() => {
                        selectEvent(null);
                        try { localStorage.setItem('viva360.space.event_create.type', 'retreat'); } catch { /* ignore */ }
                        go('EVENT_CREATE');
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <Plus size={16} /> Criar Novo Retiro
                </button>
            }
        >
            <div className="space-y-6 px-4 pb-24">
                {isLoading ? (
                    [1, 2].map((i) => (
                        <div key={i} className="bg-white rounded-[2.5rem] border border-nature-100 shadow-sm overflow-hidden group animate-pulse">
                            <div className="h-32 bg-nature-100"></div>
                            <div className="p-6 space-y-3">
                                <div className="h-4 bg-nature-100 rounded w-2/3"></div>
                                <div className="h-3 bg-nature-100 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))
                ) : retreats.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] border border-nature-100 shadow-sm p-8 text-center">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <Calendar size={28} />
                        </div>
                        <h3 className="font-serif italic text-xl text-nature-900">Nenhum retiro criado ainda</h3>
                        <p className="text-sm text-nature-500 mt-2 leading-relaxed">
                            Quando você criar seu primeiro retiro, ele aparecerá aqui com vagas, datas e organização do fluxo.
                        </p>
                    </div>
                ) : retreats.map(retreat => (
                    <div
                        key={retreat.id}
                        className="bg-white rounded-[2.5rem] border border-nature-100 shadow-sm overflow-hidden group cursor-pointer active:scale-[0.99] transition-all"
                        onClick={() => { if (retreat.id) selectEvent(retreat.id); setSelected(retreat); }}
                    >
                        <div className="h-32 relative">
                            <img src={retreat.image} className="w-full h-full object-cover" alt={retreat.title || 'Retiro'} />
                            <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-widest text-nature-900 shadow-sm">
                                {retreat.status === 'active' ? '🟢 Ativo' : retreat.status === 'cancelled' ? '🔴 Cancelado' : '⚪ Rascunho'}
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-serif italic text-xl text-nature-900">{retreat.title}</h3>
                                    <p className="text-xs text-nature-500 font-bold flex items-center gap-2 mt-1"><Calendar size={12} /> {retreat.dates}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-nature-400 uppercase">Previsão</p>
                                    <p className="text-sm font-bold text-emerald-600">{retreat.revenue}</p>
                                </div>
                            </div>

                            <div className="w-full bg-nature-50 h-2 rounded-full overflow-hidden mb-4">
                                <div
                                    className="bg-indigo-500 h-full rounded-full"
                                    style={{ width: `${Math.min(100, Math.round((Number((retreat as Record<string, unknown>)._enrolled || 0)) / Math.max(1, Number((retreat as Record<string, unknown>)._capacity || 0)) * 100))}%` }}
                                ></div>
                            </div>

                            <div className="flex justify-between items-center">
                                <p className="text-[10px] text-nature-500 font-bold uppercase flex items-center gap-2"><Users size={12} /> {String(retreat.spots ?? "")} Vagas preenchidas</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        selectEvent(retreat.id);
                                        try { localStorage.setItem('viva360.space.event_create.type', 'retreat'); } catch { /* ignore */ }
                                        go('EVENT_CREATE');
                                    }}
                                    className="p-2 bg-nature-50 rounded-full text-nature-400 hover:bg-nature-100 transition-colors"
                                    aria-label="Editar retiro"
                                >
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <BottomSheet isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title || 'Retiro'}>
                {selected && (
                    <div className="space-y-6 pb-12">
                        <img src={selected.image} className="w-full h-40 object-cover rounded-2xl" alt={selected.title || 'Retiro'} />
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-nature-50 p-4 rounded-2xl"><p className="text-[9px] font-bold text-nature-400 uppercase">Datas</p><p className="font-bold text-nature-900 text-sm">{selected.dates}</p></div>
                            <div className="bg-nature-50 p-4 rounded-2xl"><p className="text-[9px] font-bold text-nature-400 uppercase">Vagas</p><p className="font-bold text-nature-900 text-sm">{selected.spots}</p></div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setSelected(null);
                                    selectEvent(selected.id);
                                    try { localStorage.setItem('viva360.space.event_create.type', 'retreat'); } catch { /* ignore */ }
                                    go('EVENT_CREATE');
                                }}
                                className="flex-1 py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Edit3 size={14} /> Editar
                            </button>
                            <button
                                onClick={async () => {
                                    const meta = selected.meta || {};
                                    const nextMeta = { ...meta, cancelled: true, cancelledAt: new Date().toISOString() };
                                    try {
                                        await api.spaces.updateEvent(selected.id, { details: JSON.stringify(nextMeta) });
                                        setEvents((prev) => prev.map((e) => e.id === selected.id ? ({ ...e, details: JSON.stringify(nextMeta) }) : e));
                                        notify('Retiro cancelado', 'O calendário sagrado foi atualizado.', 'info');
                                    } catch {
                                        notify('Falha ao cancelar', 'Tente novamente.', 'error');
                                    } finally {
                                        setSelected(null);
                                    }
                                }}
                                className="py-4 px-6 bg-rose-50 text-rose-600 rounded-2xl font-bold uppercase tracking-widest text-xs border border-rose-100 active:scale-95"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </BottomSheet>
        </PortalView>
    );
}
