
import React, { useEffect, useMemo, useState } from 'react';
import { Professional } from '../../types';
import { Search, Plus, ArrowRightLeft, Filter, MessageCircle, Loader2, Sparkles, X } from 'lucide-react';
import { PortalView, ZenToast, BottomSheet, InteractiveButton } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';
import { api } from '../../services/api';

export const ProTribe: React.FC<{ user: Professional }> = ({ user }) => {
    const { go, notify } = useGuardiaoFlow();
    const [activeTab, setActiveTab] = useState<'market' | 'my-offers'>('market');
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [toast, setToast] = useState<{ title: string; message: string; type?: 'success' | 'info' | 'warning' | 'error' } | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [globalListings, setGlobalListings] = useState<any[]>([]);
    const [myListings, setMyListings] = useState<any[]>([]);

    const [createOpen, setCreateOpen] = useState(false);
    const [createSending, setCreateSending] = useState(false);
    const [createData, setCreateData] = useState({
        offer: '',
        wish: '',
        notes: '',
        credits: 120,
        kind: 'Mentoria' as 'Mentoria' | 'Terapia' | 'Consultoria' | 'Outro',
    });

    const parseWish = (description?: string | null) => {
        const raw = String(description || '');
        const match = raw.match(/^\s*(?:PEDE|Pede)\s*:\s*(.+)\s*$/m);
        if (match?.[1]) return match[1].trim();
        return '';
    };

    const loadEscambo = async (cancelled = { value: false }) => {
        setLoading(true);
        setError(null);
        try {
            const [all, mine] = await Promise.all([
                api.marketplace.list({ category: 'escambo' }),
                api.marketplace.list({ category: 'escambo', ownerId: String(user.id) }),
            ]);
            const toListing = (p: any) => ({
                id: String(p.id),
                offer: String(p.name || 'Oferta'),
                wish: parseWish(p.description),
                notes: String(p.description || ''),
                credits: Number(p.price || 0),
                kind: String(p.type || '').trim() || 'Outro',
                owner_id: String(p.owner_id || ''),
                owner: p.owner || null,
                image: p.image || null,
                created_at: p.created_at || null,
            });
            const allListings = (Array.isArray(all) ? all : []).map(toListing);
            const myList = (Array.isArray(mine) ? mine : []).map(toListing);
            if (!cancelled.value) {
                setMyListings(myList);
                setGlobalListings(allListings.filter((l: any) => String(l.owner_id) && String(l.owner_id) !== String(user.id)));
            }
        } catch (e: any) {
            console.warn('[ProTribe] Failed to load escambo listings:', e);
            if (!cancelled.value) {
                setError('Não foi possível carregar o mural agora.');
                setGlobalListings([]);
                setMyListings([]);
            }
        } finally {
            if (!cancelled.value) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const cancelled = { value: false };
        loadEscambo(cancelled).catch(() => undefined);
        return () => { cancelled.value = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePropose = (item: any) => {
        const targetName = item?.owner?.name || 'um guardião';
        const targetId = String(item?.owner?.id || item?.owner_id || '').trim();
        if (!targetId) {
            notify("Destino Indefinido", "Não foi possível identificar o guardião desta oferta.", "warning");
            return;
        }
        try {
            localStorage.setItem('viva360.escambo.target_id', targetId);
            localStorage.setItem('viva360.escambo.target_name', String(targetName));
            localStorage.setItem('viva360.escambo.target_offer', String(item?.offer || ''));
        } catch {
            // ignore
        }
        notify("Abrindo Proposta", `Preparando troca com ${targetName}...`, "info");
        go('ESCAMBO_PROPOSE');
    };

    const cycleFilter = () => {
        setFilter((current) => {
            if (current === 'all') return 'Mentoria';
            if (current === 'Mentoria') return 'Terapia';
            if (current === 'Terapia') return 'Consultoria';
            return 'all';
        });
    };

    const source = activeTab === 'my-offers' ? myListings : globalListings;
    const filteredExchanges = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return source.filter((item: any) => {
            const kindOk = filter === 'all' || String(item.kind || '').toLowerCase() === String(filter).toLowerCase();
            if (!kindOk) return false;
            if (!q) return true;
            const hay = [
                item.offer,
                item.wish,
                item.kind,
                item.owner?.name,
            ].filter(Boolean).join(' ').toLowerCase();
            return hay.includes(q);
        });
    }, [source, filter, searchTerm]);

    return (
        <PortalView
            title="Rede Viva"
            subtitle="COMUNIDADE DE ESCAMBO"
            onBack={() => go('DASHBOARD')}
            footer={
                activeTab === 'market' ? (
                    <div className="flex gap-2">
                        <InteractiveButton variant="primary" size="lg" onClick={cycleFilter} className="flex-1 rounded-2xl flex items-center justify-center gap-2">
                            <Filter size={14} /> Filtrar
                        </InteractiveButton>
                        <InteractiveButton variant="secondary" size="lg" onClick={() => setActiveTab('my-offers')} className="flex-1 rounded-2xl">
                            Minhas Ofertas
                        </InteractiveButton>
                    </div>
                ) : (
                    <InteractiveButton variant="primary" size="lg" onClick={() => setActiveTab('market')} className="w-full rounded-2xl">
                        Voltar ao Mural
                    </InteractiveButton>
                )
            }
        >
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            <div className="space-y-6">

                {/* HERO: CREDITS */}
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative z-10 flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-300 mb-1">Seu Saldo de Troca</p>
                            <h3 className="text-5xl font-serif italic leading-none">{(typeof user.swapCredits === 'number' ? user.swapCredits : 120)} <span className="text-lg not-italic text-indigo-300 font-sans font-bold">Créditos</span></h3>
                        </div>
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-inner">
                            <ArrowRightLeft size={24} className="text-indigo-200" />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button onClick={() => setCreateOpen(true)} className="flex-1 bg-white text-indigo-900 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                            <Plus size={14} /> Anunciar Serviço
                        </button>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex items-center gap-6 px-4 border-b border-nature-100 pb-2">
                    <button onClick={() => setActiveTab('market')} className={`pb-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'market' ? 'text-indigo-900 border-b-2 border-indigo-900' : 'text-nature-300'}`}>
                        Mural Global
                    </button>
                    <button onClick={() => setActiveTab('my-offers')} className={`pb-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'my-offers' ? 'text-indigo-900 border-b-2 border-indigo-900' : 'text-nature-300'}`}>
                        Meus Anúncios
                    </button>
                </div>

                {/* CONTENT */}
                <div className="space-y-4 pb-20">
                    {activeTab === 'market' && (
                        <>
                            <div className="bg-white p-3 rounded-2xl border border-nature-100 flex items-center gap-2 shadow-sm">
                                <Search size={18} className="text-nature-300 ml-2" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="O que você procura hoje?"
                                    className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-nature-900 placeholder:text-nature-300"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="p-2 text-nature-300 hover:text-nature-700">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-14 gap-3 opacity-70">
                                    <Loader2 size={26} className="animate-spin text-nature-300" />
                                    <p className="text-xs text-nature-400">Sincronizando o mural...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12 px-4">
                                    <p className="text-sm text-rose-500 mb-3">{error}</p>
                                    <button
                                        onClick={() => loadEscambo().catch(() => undefined)}
                                        className="text-xs text-indigo-600 font-bold uppercase tracking-widest"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            ) : filteredExchanges.length === 0 ? (
                                <div className="text-center py-14 px-6">
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                        <Sparkles size={24} />
                                    </div>
                                    <p className="text-sm italic text-nature-500">Nenhuma oferta encontrada.</p>
                                    <p className="text-[11px] text-nature-400 mt-2 leading-relaxed">
                                        Ajuste o filtro ou anuncie algo que você oferece. A Rede Viva vive de trocas reais.
                                    </p>
                                    <button
                                        onClick={() => setCreateOpen(true)}
                                        className="mt-5 px-6 py-3 bg-nature-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95"
                                    >
                                        Anunciar na Rede Viva
                                    </button>
                                </div>
                            ) : filteredExchanges.map((item: any) => (
                                <div key={item.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm hover:border-indigo-200 transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold border border-white shadow-sm overflow-hidden">
                                                {item?.owner?.avatar ? (
                                                    <img src={item.owner.avatar} className="w-full h-full object-cover" alt={item?.owner?.name || 'Guardião'} />
                                                ) : (
                                                    <span>{String(item?.owner?.name || 'G').slice(0, 1).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-nature-900 text-sm">{item?.owner?.name || 'Guardião'}</h4>
                                                <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest">{item.kind || 'Escambo'}</p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-bold uppercase">
                                            {Number(item.credits || 0)} Cr
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-nature-50/50 p-4 rounded-2xl mb-4">
                                        <div className="flex-1">
                                            <p className="text-[9px] font-bold uppercase text-nature-400 tracking-wider mb-0.5">OFERECE</p>
                                            <p className="font-serif italic text-nature-900 leading-tight">{item.offer}</p>
                                        </div>
                                        <ArrowRightLeft size={16} className="text-nature-300" />
                                        <div className="flex-1 text-right">
                                            <p className="text-[9px] font-bold uppercase text-nature-400 tracking-wider mb-0.5">PEDE</p>
                                            <p className="font-serif italic text-indigo-900 leading-tight">{item.wish || 'A combinar'}</p>
                                        </div>
                                    </div>

                                    <button onClick={() => handlePropose(item)} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
                                        <MessageCircle size={14} /> Propor Troca
                                    </button>
                                </div>
                            ))}
                        </>
                    )}

                    {activeTab === 'my-offers' && (
                        <>
                            <div className="bg-white p-3 rounded-2xl border border-nature-100 flex items-center gap-2 shadow-sm">
                                <Search size={18} className="text-nature-300 ml-2" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar nos seus anúncios..."
                                    className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-nature-900 placeholder:text-nature-300"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="p-2 text-nature-300 hover:text-nature-700">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-14 gap-3 opacity-70">
                                    <Loader2 size={26} className="animate-spin text-nature-300" />
                                    <p className="text-xs text-nature-400">Carregando seus anúncios...</p>
                                </div>
                            ) : filteredExchanges.length === 0 ? (
                                <div className="text-center py-12 opacity-60 space-y-4">
                                    <Sparkles size={44} className="mx-auto text-nature-300" />
                                    <p className="text-sm italic">Você ainda não anunciou nada na Rede Viva.</p>
                                    <button onClick={() => setCreateOpen(true)} className="text-indigo-600 font-bold text-xs uppercase tracking-widest underline">Criar Primeiro Anúncio</button>
                                </div>
                            ) : (
                                filteredExchanges.map((item: any) => (
                                    <div key={item.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm hover:border-indigo-200 transition-all relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-nature-900 text-sm">{item.offer}</h4>
                                                <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest">{item.kind || 'Escambo'}</p>
                                            </div>
                                            <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-bold uppercase">
                                                {Number(item.credits || 0)} Cr
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-nature-50/50 p-4 rounded-2xl">
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold uppercase text-nature-400 tracking-wider mb-0.5">PEDE</p>
                                                <p className="font-serif italic text-indigo-900 leading-tight">{item.wish || 'A combinar'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>

            </div>

            <BottomSheet isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Anunciar na Rede Viva">
                <div className="space-y-5 pb-10">
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">Escambo real</p>
                        <p className="text-sm text-indigo-900 mt-1 leading-relaxed">
                            Crie um anúncio claro: o que você oferece e o que você busca em troca.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-nature-400 uppercase tracking-widest px-2">Tipo</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['Mentoria', 'Terapia', 'Consultoria', 'Outro'] as const).map((k) => (
                                <button
                                    key={k}
                                    onClick={() => setCreateData((s) => ({ ...s, kind: k }))}
                                    className={`py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${createData.kind === k ? 'bg-nature-900 text-white border-nature-900' : 'bg-white text-nature-500 border-nature-100'
                                        }`}
                                >
                                    {k}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-nature-400 uppercase tracking-widest px-2">Oferece</label>
                        <input
                            value={createData.offer}
                            onChange={(e) => setCreateData((s) => ({ ...s, offer: e.target.value }))}
                            placeholder="Ex: Sessão de Reiki, Mentoria 1h, Mapa Astral..."
                            className="w-full p-4 bg-white border border-nature-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium text-nature-900"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-nature-400 uppercase tracking-widest px-2">Pede</label>
                        <input
                            value={createData.wish}
                            onChange={(e) => setCreateData((s) => ({ ...s, wish: e.target.value }))}
                            placeholder="Ex: Design, Yoga, edição, colaboração..."
                            className="w-full p-4 bg-white border border-nature-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium text-nature-900"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-nature-400 uppercase tracking-widest px-2">Notas (opcional)</label>
                        <textarea
                            value={createData.notes}
                            onChange={(e) => setCreateData((s) => ({ ...s, notes: e.target.value }))}
                            placeholder="Detalhes, condições, disponibilidade..."
                            className="w-full p-4 bg-white border border-nature-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm text-nature-700 h-28 resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-nature-400 uppercase tracking-widest px-2">Créditos sugeridos</label>
                        <input
                            type="number"
                            min={0}
                            value={createData.credits}
                            onChange={(e) => setCreateData((s) => ({ ...s, credits: Number(e.target.value) }))}
                            className="w-full p-4 bg-white border border-nature-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-bold text-nature-900"
                        />
                    </div>

                    <button
                        onClick={async () => {
                            const offer = createData.offer.trim();
                            if (!offer) {
                                notify("Campo Obrigatório", "Descreva o que você oferece.", "warning");
                                return;
                            }
                            if (createSending) return;
                            setCreateSending(true);
                            try {
                                const descriptionLines = [
                                    createData.wish.trim() ? `PEDE: ${createData.wish.trim()}` : null,
                                    createData.notes.trim() ? createData.notes.trim() : null,
                                ].filter(Boolean);
                                await api.marketplace.create({
                                    name: offer,
                                    price: Number.isFinite(createData.credits) ? createData.credits : 0,
                                    category: 'escambo',
                                    type: createData.kind,
                                    description: descriptionLines.join('\n\n'),
                                    image: 'https://images.unsplash.com/photo-1520975682031-a1e38a5a0b46?q=80&w=1200',
                                });
                                setToast({ title: 'Anúncio publicado', message: 'Sua oferta já aparece no Mural Global e nos seus anúncios.', type: 'success' });
                                setCreateOpen(false);
                                setCreateData({ offer: '', wish: '', notes: '', credits: 120, kind: 'Mentoria' });
                                await loadEscambo();
                            } catch (e: any) {
                                setToast({ title: 'Falha ao publicar', message: e?.message || 'Tente novamente.', type: 'error' });
                            } finally {
                                setCreateSending(false);
                            }
                        }}
                        disabled={createSending}
                        className="w-full py-4 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
                    >
                        {createSending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} {createSending ? 'Publicando...' : 'Publicar Anúncio'}
                    </button>
                </div>
            </BottomSheet>
        </PortalView>
    );
};
