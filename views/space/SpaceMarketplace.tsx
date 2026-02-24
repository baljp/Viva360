import React, { useState } from 'react';
import { Plus, ShoppingBag, Store, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { ViewState, User, Product } from '../../types';
import { PortalView, ProductFormModal } from '../../components/Common';
import { api } from '../../services/api';
import { MarketplaceExplorer } from '../../components/MarketplaceExplorer';
import { runConfirmedAction } from '../../src/utils/runConfirmedAction';

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
    const [activeTab, setActiveTab] = useState<'explore' | 'manage'>('explore');
    const [searchQuery, setSearchQuery] = useState('');
    const notify = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') =>
      flow?.notify?.(title, message, type);

    const handleBuyWrapper = (product: Product) => {
        notify('Interesse Enviado', `O vendedor de "${product.name}" foi notificado.`, 'success');
    };

    const handleDeleteProduct = async (productId: string) => {
        await runConfirmedAction({
            action: () => api.marketplace.delete(productId),
            validateResult: (success) => success === true,
            refresh: () => Promise.resolve(refreshData()),
            notify,
            successToast: {
                title: 'Item removido',
                message: 'O item foi retirado do seu bazar.',
                type: 'info',
            },
            failToast: {
                title: 'Falha na remoção',
                message: 'Não foi possível remover o item agora.',
                type: 'warning',
            },
        });
    };

    const handlePreviewProduct = (product: Product) => {
        notify('Pré-visualização', `Abrindo detalhes de "${product.name}".`, 'info');
    };

    const handleRefreshProduct = async (product: Product) => {
        await runConfirmedAction({
            action: async () => ({ ok: true }),
            refresh: () => Promise.resolve(refreshData()),
            notify,
            successToast: {
                title: 'Item sincronizado',
                message: `"${product.name}" foi atualizado com dados recentes.`,
                type: 'success',
            },
            failToast: {
                title: 'Falha na sincronização',
                message: 'Não foi possível atualizar a lista agora.',
                type: 'error',
            },
        });
    };

    return (
        <>
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
                            <MarketplaceExplorer onPurchase={handleBuyWrapper} />
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
                                                    <button aria-label="Pré-visualizar produto" onClick={() => handlePreviewProduct(prod)} className="p-2 bg-nature-50 text-nature-400 rounded-xl hover:text-nature-900 transition-colors"><Eye size={14}/></button>
                                                    <button aria-label="Atualizar produto" onClick={() => handleRefreshProduct(prod)} className="p-2 bg-nature-50 text-nature-400 rounded-xl hover:text-nature-900 transition-colors"><RefreshCw size={14}/></button>
                                                    <button aria-label="Excluir produto" onClick={() => handleDeleteProduct(prod.id)} className="p-2 bg-rose-50 text-rose-300 rounded-xl hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
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
                    await runConfirmedAction({
                        action: () => api.marketplace.create({ ...pData, ownerId: user.id }),
                        refresh: () => Promise.resolve(refreshData()),
                        notify,
                        successToast: {
                            title: 'Item Ancorado',
                            message: 'Sua nova alquimia já está disponível no Bazar Global.',
                            type: 'success',
                        },
                        failToast: {
                            title: 'Falha no cadastro',
                            message: 'Não foi possível publicar o item.',
                            type: 'warning',
                        },
                    });
                }} />
            </PortalView>
        </>
    );
};
