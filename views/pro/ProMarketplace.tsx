
import React, { useState } from 'react';
import { ViewState, Professional, Product } from '../../types';
import { Plus, Star, Layers, ExternalLink, Award, Save, Trash2, ShoppingBag, Store } from 'lucide-react';
import { PortalView, ProductFormModal } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/useGuardiaoFlow';
import { api } from '../../services/api';
import { MarketplaceExplorer } from '../../components/MarketplaceExplorer';
import { runConfirmedAction } from '../../src/utils/runConfirmedAction';

type ProductFormInput = {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    type?: string;
    image?: string;
    karmaReward?: number;
};

export const ProMarketplace: React.FC<{ 
    user: Professional, 
    myProducts?: Product[], 
    refreshData?: () => void 
}> = ({ user, myProducts = [], refreshData = () => {} }) => {
    const { go, notify } = useGuardiaoFlow();
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [activeTab, setActiveTab] = useState<'manage' | 'explore'>('manage');
    const [buyingId, setBuyingId] = useState<string | null>(null);

    const handleAddProduct = async (pData: ProductFormInput) => {
        await runConfirmedAction({
            action: () => api.marketplace.create({ ...pData, ownerId: user.id }),
            refresh: () => Promise.resolve(refreshData()),
            notify,
            successToast: {
                title: 'Item Ancorado',
                message: 'Sua nova alquimia foi adicionada.',
                type: 'success',
            },
            failToast: {
                title: 'Falha no cadastro',
                message: 'Não foi possível publicar o item.',
                type: 'error',
            },
        });
    };

    // MOD-02: Real POST /marketplace/purchase instead of toast-only
    const handleBuy = async (product: Product) => {
        if (buyingId) return;
        setBuyingId(product.id);
        try {
            await runConfirmedAction({
                action: () => api.marketplace.purchase(product.id, product.price, product.name),
                refresh: () => Promise.resolve(refreshData()),
                notify,
                successToast: {
                    title: 'Interesse Registrado',
                    message: `O vendedor de "${product.name}" foi notificado via plataforma.`,
                    type: 'success',
                },
                failToast: {
                    title: 'Erro',
                    message: (err: unknown) =>
                        (err && typeof err === 'object' && 'message' in err)
                            ? String((err as { message?: unknown }).message || 'Não foi possível registrar interesse.')
                            : 'Não foi possível registrar interesse.',
                    type: 'error',
                },
            });
        } finally {
            setBuyingId(null);
        }
    };

    const handleSaveProduct = (product: Product) => {
        setActiveTab('explore');
        notify('Bazar Global', `"${product.name}" está aberto para comparação com o mercado.`, 'success');
    };

    return (
    <PortalView 
        title="Alquimia" 
        subtitle="MERCADO E BAZAR" 
        onBack={() => go('DASHBOARD')}
        footer={
            activeTab === 'manage' ? (
                <button onClick={() => go('ESCAMBO_PROPOSE')} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <Plus size={18}/> Novo Produto ou Ritual
                </button>
            ) : null
        }
    >
        <div className="space-y-6">
            <div className="flex p-1 bg-nature-50 rounded-2xl">
                <button onClick={() => setActiveTab('manage')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'manage' ? 'bg-white shadow-sm text-nature-900' : 'text-nature-400 hover:text-nature-600'}`}>
                    <Store size={14}/> Minha Alquimia
                </button>
                <button onClick={() => setActiveTab('explore')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'explore' ? 'bg-white shadow-sm text-nature-900' : 'text-nature-400 hover:text-nature-600'}`}>
                    <ShoppingBag size={14}/> Bazar Global
                </button>
            </div>

            {activeTab === 'manage' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm text-center">
                            <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Vendas Mês</p>
                            <h4 className="text-2xl font-serif italic text-nature-900">42</h4>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-nature-100 shadow-sm text-center">
                            <p className="text-[9px] font-bold text-nature-400 uppercase mb-1">Reputação Bazar</p>
                            <div className="flex items-center justify-center gap-1 text-amber-500">
                                <span className="text-2xl font-serif italic">4.9</span>
                                <Star size={14} fill="currentColor"/>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pb-24">
                        <div className="flex justify-between items-center px-2">
                            <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Meu Inventário Ativo</h4>
                            <Layers size={14} className="text-nature-200"/>
                        </div>
                        
                        {myProducts.length > 0 ? myProducts.map(prod => (
                            <div key={prod.id} className="bg-white p-4 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-4 group">
                                <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shrink-0 relative bg-nature-50">
                                    <img src={prod.image} className="w-full h-full object-cover" alt={prod.name || 'Produto'} />
                                    <div className="absolute top-1 right-1 bg-white/90 p-1 rounded-lg text-nature-900 shadow-sm"><ExternalLink size={10}/></div>
                                </div>
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-nature-900 text-sm truncate">{prod.name}</h4>
                                        <span className="text-[10px] font-bold text-nature-900">R$ {prod.price}</span>
                                    </div>
                                    <p className="text-[9px] text-nature-400 font-bold uppercase mt-1 tracking-widest">{prod.category} • {prod.type === 'physical' ? 'Em estoque' : 'Digital'}</p>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-1.5 text-emerald-600"><Award size={10}/><span className="text-[9px] font-bold uppercase">+{prod.karmaReward} Karma</span></div>
                                        <div className="flex gap-2">
                                            <button aria-label="Salvar produto" onClick={() => handleSaveProduct(prod)} className="p-2 bg-nature-50 text-nature-300 rounded-lg hover:text-nature-900 transition-colors"><Save size={14}/></button>
                                            <button
                                                aria-label="Excluir produto"
                                                onClick={() => {
                                                    void runConfirmedAction({
                                                        action: () => api.marketplace.delete(prod.id),
                                                        validateResult: (success) => success === true,
                                                        refresh: () => Promise.resolve(refreshData()),
                                                        notify,
                                                        successToast: {
                                                            title: 'Item removido',
                                                            message: `"${prod.name}" foi removido do inventário.`,
                                                            type: 'info',
                                                        },
                                                        failToast: {
                                                            title: 'Falha na remoção',
                                                            message: 'Não foi possível remover o item agora.',
                                                            type: 'warning',
                                                        },
                                                    });
                                                }}
                                                className="p-2 bg-rose-50 text-rose-300 rounded-lg hover:text-rose-600 transition-colors"
                                            ><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center opacity-30 space-y-4">
                                <ShoppingBag size={48} className="mx-auto" />
                                <p className="italic text-sm">Seu bazar está em silêncio.<br/>Manifeste seu primeiro item.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'explore' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
                     <MarketplaceExplorer onPurchase={handleBuy} onTrade={() => go('ESCAMBO_TRADE')} />
                </div>
            )}
        </div>
        <ProductFormModal isOpen={showAddProduct} onClose={() => setShowAddProduct(false)} onSubmit={handleAddProduct} />
    </PortalView>
    );
};
