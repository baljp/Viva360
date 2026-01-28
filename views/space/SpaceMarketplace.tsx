import React, { useState } from 'react';
import { Plus, ShoppingBag, LayoutGrid, Package, Flame, DoorOpen, Tag, TrendingUp, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { ViewState, User, Product } from '../../types';
import { PortalView, ProductFormModal, ZenToast } from '../../components/Common';
import { api } from '../../services/api';

interface SpaceMarketplaceProps {
    view: ViewState;
    setView: (v: ViewState) => void;
    user: User;
    myProducts: Product[];
    refreshData: () => Promise<void>;
    flow: any;
}

export const SpaceMarketplace: React.FC<SpaceMarketplaceProps> = ({ view, setView, user, myProducts, refreshData, flow }) => {
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);

    return (
        <>
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            <PortalView 
                title="Alquimia Comercial" 
                subtitle="INVENTÁRIO DO HUB" 
                onBack={() => flow.go('EXEC_DASHBOARD')}
                footer={
                    <button onClick={() => setShowAddProduct(true)} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <Plus size={18}/> Novo Produto ou Aluguel
                    </button>
                }
            >
                <div className="space-y-8">
                    <div className="bg-amber-900 rounded-[3.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10 flex justify-between items-end">
                            <div className="space-y-4">
                                <div className="p-3 bg-white/10 rounded-2xl w-fit"><ShoppingBag size={24} className="text-amber-400" /></div>
                                <div>
                                <h3 className="text-3xl font-serif italic leading-none">Bazar Ativo</h3>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200 mt-2">Monitore suas Ofertas</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-serif">84%</p>
                                <p className="text-[8px] font-bold uppercase opacity-60">Meta de Vendas</p>
                            </div>
                        </div>
                    </div>
        
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                        {[
                            { id: 'all', label: 'Tudo', icon: LayoutGrid },
                            { id: 'physical', label: 'Insumos', icon: Package },
                            { id: 'event', label: 'Portais', icon: Flame },
                            { id: 'rental', label: 'Altares', icon: DoorOpen }
                        ].map(tab => (
                            <button key={tab.id} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-nature-100 text-[10px] font-bold uppercase tracking-widest text-nature-400 whitespace-nowrap hover:border-primary-500 transition-all">
                                <tab.icon size={14}/> {tab.label}
                            </button>
                        ))}
                    </div>
        
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Catálogo Vigente</h4>
                            <span className="text-[9px] font-bold text-nature-300 uppercase tracking-tighter">{myProducts.length} itens listados</span>
                        </div>
                        
                        {myProducts.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {myProducts.map(prod => (
                                    <div key={prod.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-all">
                                        <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0 relative bg-nature-50">
                                            <img src={prod.image} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={prod.name} />
                                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-sm text-nature-900"><Tag size={10}/></div>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 h-24">
                                            <div className="space-y-0.5">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-nature-900 text-sm truncate">{prod.name}</h4>
                                                    <span className="text-[10px] font-bold text-nature-900">R$ {prod.price}</span>
                                                </div>
                                                <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest">{prod.category} • {prod.type === 'physical' ? 'Estoque: 12' : 'Vagas: 5'}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                                    <TrendingUp size={10} className="text-emerald-500"/><span className="text-[8px] font-black text-emerald-600 uppercase">+{prod.karmaReward} K</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="p-2.5 bg-nature-50 text-nature-300 rounded-xl hover:text-primary-600 transition-colors"><Eye size={14}/></button>
                                                    <button className="p-2.5 bg-nature-50 text-nature-300 rounded-xl hover:text-nature-900 transition-colors"><RefreshCw size={14}/></button>
                                                    <button onClick={() => api.marketplace.delete(prod.id).then(refreshData)} className="p-2.5 bg-rose-50 text-rose-300 rounded-xl hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center space-y-6 bg-white rounded-[3rem] border border-dashed border-nature-200">
                                <div className="w-24 h-24 bg-nature-50 rounded-full flex items-center justify-center mx-auto text-nature-200"><ShoppingBag size={40} /></div>
                                <div className="space-y-1">
                                    <h4 className="font-serif italic text-xl text-nature-900">Bazar Silencioso</h4>
                                    <p className="text-xs text-nature-400 px-12 leading-relaxed italic">"Suas prateleiras aguardam a manifestação de novos itens para o ecossistema."</p>
                                </div>
                                <button onClick={() => setShowAddProduct(true)} className="px-8 py-3 bg-nature-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg">Começar Manifestação</button>
                            </div>
                        )}
                    </div>
                </div>
                <ProductFormModal isOpen={showAddProduct} onClose={() => setShowAddProduct(false)} onSubmit={async (pData) => {
                    await api.marketplace.create({ ...pData, ownerId: user.id });
                    refreshData();
                    setToast({ title: "Item Ancorado", message: "Sua nova alquimia já está disponível no Bazar Global." });
                }} />
            </PortalView>
        </>
    );
};
