import React, { useEffect, useState } from 'react';
import { useSantuarioFlow } from '../../../src/flow/useSantuarioFlow';
import { PortalView } from '../../../components/Common';
import { Calendar, Users, Ticket, ArrowRight } from 'lucide-react';
import { api } from '../../../services/api';
import { runConfirmedAction } from '../../../src/utils/runConfirmedAction';
import { Event } from '../../../types';

export default function SpaceEventCreate() {
    const { back, go, notify, state, selectEvent } = useSantuarioFlow();
    const [step, setStep] = useState(1);
    const editingId = state.selectedEventId;
    const preselectedType = (() => {
        try {
            return localStorage.getItem('viva360.space.event_create.type') || '';
        } catch {
            return '';
        }
    })();
    const [eventType, setEventType] = useState(preselectedType || 'workshop'); // workshop, retreat
    const [title, setTitle] = useState('');
    const [capacity, setCapacity] = useState<number>(15);
    const [roomName, setRoomName] = useState('');
    const [price, setPrice] = useState<number>(0);
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [startTime, setStartTime] = useState<string>('09:00');
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [endTime, setEndTime] = useState<string>('10:30');
    const [submitting, setSubmitting] = useState(false);

    const parseMeta = (details?: string | null) => {
        if (!details) return {};
        try {
            const parsed = JSON.parse(details);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    };

    const isEditing = !!editingId;
    const editingLabel = isEditing ? 'Salvar Alterações' : 'Publicar Vivência';

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!editingId) return;
            setSubmitting(true);
            try {
                const ev = await api.spaces.getEvent(editingId);
                if (!mounted || !ev) return;
                const eventData = ev as Event;
                const meta = parseMeta(eventData.details || eventData.description);
                const start = eventData.start_time ? new Date(eventData.start_time) : (eventData.date ? new Date(`${eventData.date}T${eventData.time || '00:00'}:00`) : new Date());
                const end = eventData.end_time ? new Date(eventData.end_time) : new Date(start.getTime() + (eventData.duration || 60) * 60 * 1000);

                setTitle(eventData.title || '');
                setEventType(String(meta.kind || eventData.tags?.[0] || preselectedType || 'workshop'));
                setCapacity(eventData.capacity || 15);
                setRoomName(eventData.location || '');
                setPrice(eventData.price || 0);
                setStartDate(start.toISOString().slice(0, 10));
                setStartTime(start.toISOString().slice(11, 16));
                setEndDate(end.toISOString().slice(0, 10));
                setEndTime(end.toISOString().slice(11, 16));
            } catch (e: any) {
                if (!mounted) return;
                notify('Falha ao carregar', e?.message || 'Não foi possível abrir este evento.', 'error');
            } finally {
                if (mounted) setSubmitting(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [editingId]);

    const handleNext = () => {
        if (step < 2) return setStep(step + 1);
        if (!title.trim()) {
            notify('Nome Necessário', 'Dê um nome à vivência.', 'warning');
            return;
        }

        setSubmitting(true);
        (async () => {
            const start = new Date(`${startDate}T${startTime}:00`);
            const end = new Date(`${endDate}T${endTime}:00`);
            const safeEnd = end.getTime() > start.getTime() ? end : new Date(start.getTime() + 60 * 60 * 1000);
            const details = JSON.stringify({
                kind: eventType,
                capacity,
                roomName,
                price,
            });

            const result = await runConfirmedAction({
                action: async () => {
                    if (editingId) {
                        await api.spaces.updateEvent(editingId, {
                            title,
                            start: start.toISOString(),
                            end: safeEnd.toISOString(),
                            type: eventType,
                            details,
                        });
                        return { eventId: editingId, mode: 'update' as const };
                    }
                    const created = await api.spaces.createEvent({
                        title,
                        start: start.toISOString(),
                        end: safeEnd.toISOString(),
                        type: eventType,
                        details,
                    });
                    return { eventId: String((created as { id: string })?.id || ''), mode: 'create' as const };
                },
                refresh: () => api.spaces.getEvents(),
                notify,
                successToast: {
                    title: isEditing ? 'Vivência Atualizada' : 'Vivência Publicada',
                    message: 'O calendário sagrado foi atualizado.',
                    type: 'success',
                },
                failToast: {
                    title: 'Falha ao publicar',
                    message: (e) => (e as any)?.message || 'Não foi possível criar o evento.',
                    type: 'error',
                },
                onSuccess: () => {
                    try { localStorage.removeItem('viva360.space.event_create.type'); } catch { /* ignore */ }
                    selectEvent(null);
                },
                navigate: () => go(eventType === 'retreat' ? 'RETREATS_MANAGE' : 'EVENTS_MANAGE'),
            });

            if (!result.ok) {
                return;
            }
        })().finally(() => {
            setSubmitting(false);
        });
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
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
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
                                    <Calendar className="text-indigo-400" size={20} />
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full outline-none font-bold text-nature-700 bg-transparent" />
                                </div>
                                <div className="p-4 bg-white border border-nature-100 rounded-2xl flex items-center gap-3">
                                    <Users className="text-indigo-400" size={20} />
                                    <input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value || 0))} placeholder="Vagas" className="w-full outline-none font-bold text-nature-700 bg-transparent" />
                                </div>
                                <div className="p-4 bg-white border border-nature-100 rounded-2xl flex items-center gap-3">
                                    <Calendar className="text-emerald-400" size={20} />
                                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full outline-none font-bold text-nature-700 bg-transparent" />
                                </div>
                                <div className="p-4 bg-white border border-nature-100 rounded-2xl flex items-center gap-3">
                                    <Calendar className="text-amber-400" size={20} />
                                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full outline-none font-bold text-nature-700 bg-transparent" />
                                </div>
                                {eventType === 'retreat' && (
                                    <>
                                        <div className="p-4 bg-white border border-nature-100 rounded-2xl flex items-center gap-3">
                                            <Calendar className="text-indigo-400" size={20} />
                                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full outline-none font-bold text-nature-700 bg-transparent" />
                                        </div>
                                        <div className="p-4 bg-white border border-nature-100 rounded-2xl flex items-center gap-3">
                                            <Calendar className="text-indigo-400" size={20} />
                                            <span className="text-xs font-bold text-nature-600">Multi-dia</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Onde?</label>
                            <select value={roomName} onChange={(e) => setRoomName(e.target.value)} className="w-full p-5 bg-white border border-nature-100 rounded-2xl focus:border-indigo-300 outline-none font-bold text-nature-700">
                                <option>Sala Cristal</option>
                                <option>Templo Solar</option>
                                <option>Jardim Externo</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-nature-400 pl-4">Valor de Troca</label>
                            <div className="p-5 bg-white border border-nature-100 rounded-2xl flex items-center gap-3">
                                <Ticket className="text-emerald-500" size={20} />
                                <span className="font-bold text-nature-900">R$</span>
                                <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value || 0))} placeholder="0,00" className="w-full outline-none text-lg font-bold text-nature-900 bg-transparent" />
                            </div>
                        </div>
                    </div>
                )}

                <button disabled={submitting} onClick={handleNext} className="w-full py-5 bg-nature-900 text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 mt-8 disabled:opacity-60">
                    {step === 2 ? editingLabel : 'Continuar'} <ArrowRight size={20} />
                </button>
            </div>
        </PortalView>
    );
}
