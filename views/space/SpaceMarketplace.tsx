import React, { useState } from 'react';
import { Plus, ShoppingBag, LayoutGrid, Package, Flame, DoorOpen, Tag, TrendingUp, Eye, RefreshCw, Trash2, Search, Filter, ShoppingCart, Store } from 'lucide-react';
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
    const [toast, setToast] = useState<{title: string, message: string, type?: 'success' | 'info' | 'warning'} | null>(null);
    const [activeTab, setActiveTab] = useState<'explore' | 'manage'>('explore');
    const [searchQuery, setSearchQuery] = useState('');

    // Mock Global Products (what others are selling)
    const globalProducts = [
        { id: 'g1', name: 'Kit Cristais Lemurianos', price: 450, category: 'Insumos', seller: 'Guardião Atlas', type: 'physical', image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=600', karma: 50 },
        { id: 'g2', name: 'E-book: Gestão de Egrégoras', price: 89, category: 'Digital', seller: 'Santuário Luz', type: 'digital', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600', karma: 20 },
        { id: 'g3', name: 'Incensos Naturais Artesanais', price: 45, category: 'Insumos', seller: 'Guardiã Maya', type: 'physical', image: 'https://images.unsplash.com/photo-1602159079979-43c2c2f6d534?q=80&w=600', karma: 10 },
        { id: 'g4', name: 'Mentoria para Terapeutas', price: 900, category: 'Serviço', seller: 'Mestre Sol', type: 'service', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600', karma: 200 },
    ];

    const handleBuy = (prodName: string) => {
        setToast({ title: 'Interesse Enviado', message: `O vendedor de "${prodName}" foi notificado.`, type: 'success' });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <>
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            <PortalView 
                title="Bazar do Santuário" 
                subtitle="ECOSSITEMA DE TROCAS" 
                onBack={() => flow.go('EXEC_DASHBOARD')}
                footer={
                    activeTab === 'manage' ? (
                        <button onClick={() => setShowAddProduct(true)} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <Plus size={18}/> Novo Produto ou Aluguel
                        </button>
                    ) : null
                }
            >
                <div className="space-y-6">
                    {/* Header Tabs */}
                    <div className="flex p-1 bg-nature-50 rounded-2xl">
                        <button onClick={() => setActiveTab('explore')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'explore' ? 'bg-white shadow-sm text-nature-900' : 'text-nature-400 hover:text-nature-600'}`}>
                            <ShoppingBag size={14}/> Explorar Bazar
                        </button>
                        <button onClick={() => setActiveTab('manage')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'manage' ? 'bg-white shadow-sm text-nature-900' : 'text-nature-400 hover:text-nature-600'}`}>
                            <Store size={14}/> Meus Itens
                        </button>
                    </div>

                    {activeTab === 'explore' && (
                        <>
                            {/* Search & Filters */}
                            <div className="flex gap-2">
                                <div className="flex-1 bg-white h-12 rounded-2xl border border-nature-100 flex items-center px-4 gap-2 shadow-sm focus-within:border-nature-300 transition-colors">
                                    <Search size={16} className="text-nature-300"/>
                                    <input 
                                        type="text" 
                                        placeholder="Buscar produtos, rituais ou insumos..." 
                                        className="flex-1 bg-transparent text-sm font-medium text-nature-900 placeholder:text-nature-300 outline-none"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button className="w-12 h-12 bg-white rounded-2xl border border-nature-100 flex items-center justify-center text-nature-400 hover:text-nature-600 hover:bg-nature-50">
                                    <Filter size={16}/>
                                </button>
                            </div>

                            {/* Tags */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {['Todos', 'Insumos', 'Digitais', 'Serviços', 'Altares'].map(tag => (
                                    <button key={tag} className="px-4 py-2 bg-white border border-nature-100 rounded-xl text-[10px] font-bold text-nature-500 uppercase whitespace-nowrap hover:bg-nature-50 hover:border-nature-200 transition-all">
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            {/* Global List */}
                            <div className="space-y-4 pb-24">
                                {globalProducts.map(prod => (
                                    <div key={prod.id} className="bg-white p-4 rounded-[2.5rem] border border-nature-100 shadow-sm flex gap-4 group hover:shadow-md transition-all">
                                        <div className="w-24 h-24 rounded-[1.8rem] overflow-hidden shrink-0 bg-nature-50">
                                            <img src={prod.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-nature-900 text-sm leading-tight mb-1">{prod.name}</h4>
                                                        <p className="text-[9px] font-bold text-nature-400 uppercase tracking-wide flex items-center gap-1">
                                                            <Store size={10}/> {prod.seller}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block font-bold text-nature-900 text-sm">R$ {prod.price}</span>
                                                        <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase">+{prod.karma} Karma</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end mt-2">
                                                <span className="px-2 py-1 bg-nature-50 rounded-lg text-[8px] font-bold text-nature-500 uppercase border border-nature-100">{prod.category}</span>
                                                <button onClick={() => handleBuy(prod.name)} className="px-4 py-2 bg-nature-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-colors flex items-center gap-2">
                                                    <ShoppingCart size={12}/> Comprar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {activeTab === 'manage' && (
                        <div className="space-y-4 pb-24">
                            <div className="bg-amber-900/5 p-6 rounded-[2.5rem] border border-amber-900/10 mb-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-amber-900/10 rounded-2xl flex items-center justify-center text-amber-900"><Store size={24}/></div>
                                   <div>
                                       <h4 className="font-serif italic text-xl text-amber-900">Meu Estoque</h4>
                                       <p className="text-xs text-amber-800/60 leading-tight pr-4">Gerencie os produtos e serviços que você oferece à comunidade.</p>
                                   </div>
                                </div>
                            </div>

                            {myProducts.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {myProducts.map(prod => (
                                        <div key={prod.id} className="bg-white p-5 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-5 group">
                                            <div className="w-20 h-20 rounded-3xl overflow-hidden shrink-0 relative bg-nature-50">
                                                <img src={prod.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={prod.name} />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-nature-900 text-sm truncate">{prod.name}</h4>
                                                    <span className="text-[10px] font-bold text-nature-900">R$ {prod.price}</span>
                                                </div>
                                                <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest mb-3">{prod.category} • {prod.type === 'physical' ? 'Em Estoque' : 'Digital'}</p>
                                                <div className="flex gap-2 justify-end">
                                                    <button className="p-2 bg-nature-50 text-nature-400 rounded-xl hover:text-nature-900 transition-colors"><Eye size={14}/></button>
                                                    <button className="p-2 bg-nature-50 text-nature-400 rounded-xl hover:text-nature-900 transition-colors"><RefreshCw size={14}/></button>
                                                    <button onClick={() => api.marketplace.delete(prod.id).then(refreshData)} className="p-2 bg-rose-50 text-rose-300 rounded-xl hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-6 opacity-60">
                                    <Store size={48} className="mx-auto text-nature-300" />
                                    <p className="italic text-sm text-nature-500">Você ainda não tem itens listados.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <ProductFormModal isOpen={showAddProduct} onClose={() => setShowAddProduct(false)} onSubmit={async (pData) => {
                    await api.marketplace.create({ ...pData, ownerId: user.id });
                    refreshData();
                    setToast({ title: "Item Ancorado", message: "Sua nova alquimia já está disponível no Bazar Global.", type: 'success' });
                }} />
            </PortalView>
        </>
    );
};
