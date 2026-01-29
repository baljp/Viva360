
import React, { useState } from 'react';
import { ViewState, Professional, Product } from '../../types';
import { Plus, Star, Layers, ExternalLink, Award, Save, Trash2, ShoppingBag } from 'lucide-react';
import { PortalView, ProductFormModal } from '../../components/Common';
import { useGuardiaoFlow } from '../../src/flow/GuardiaoFlowContext';
import { api } from '../../services/api';

export const ProMarketplace: React.FC<{ 
    user: Professional, 
    myProducts?: Product[], 
    refreshData?: () => void 
}> = ({ user, myProducts = [], refreshData = () => {} }) => {
    const { go } = useGuardiaoFlow();
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);

    const handleAddProduct = async (pData: any) => {
        await api.marketplace.create({ ...pData, ownerId: user.id });
        refreshData();
        // Toast handling would be ideal here if context provided it, or internal state
    };

    return (
    <PortalView 
        title="Meu Bazar" 
        subtitle="MEU NEGÓCIO" 
        onBack={() => go('DASHBOARD')}
        footer={
            <button onClick={() => setShowAddProduct(true)} className="w-full py-5 bg-nature-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-center gap-2">
                <Plus size={18}/> Novo Produto ou Ritual
            </button>
        }
    >
        <div className="space-y-8">
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

            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h4 className="text-[10px] font-bold text-nature-400 uppercase tracking-widest">Meu Inventário Ativo</h4>
                    <Layers size={14} className="text-nature-200"/>
                </div>
                
                {myProducts.length > 0 ? myProducts.map(prod => (
                    <div key={prod.id} className="bg-white p-4 rounded-[2.5rem] border border-nature-100 shadow-sm flex items-center gap-4 group">
                        <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shrink-0 relative">
                            <img src={prod.image} className="w-full h-full object-cover" />
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
                                    <button className="p-2 bg-nature-50 text-nature-300 rounded-lg hover:text-nature-900 transition-colors"><Save size={14}/></button>
                                    <button onClick={() => api.marketplace.delete(prod.id).then(refreshData)} className="p-2 bg-rose-50 text-rose-300 rounded-lg hover:text-rose-600 transition-colors"><Trash2 size={14}/></button>
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
        <ProductFormModal isOpen={showAddProduct} onClose={() => setShowAddProduct(false)} onSubmit={handleAddProduct} />
    </PortalView>
    );
};
