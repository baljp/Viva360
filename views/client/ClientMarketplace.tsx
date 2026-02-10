import React, { useState } from 'react';
import { Product } from '../../types';
import { PortalView, ZenToast, ZenSkeleton } from '../../components/Common';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { api } from '../../services/api';
import { MarketplaceExplorer } from '../../components/MarketplaceExplorer';
import { ShoppingBag, Sparkles, X } from 'lucide-react';

export const ClientMarketplace: React.FC<{ onAddToCart: (p: Product) => void }> = ({ onAddToCart }) => {
    const { state, go, back } = useBuscadorFlow();
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);
    const [cartItems, setCartItems] = useState<Product[]>([]);

    const handlePurchase = (product: Product) => {
        onAddToCart(product);
        setCartItems(prev => {
            const exists = prev.find(p => p.id === product.id);
            if (exists) return prev;
            return [...prev, product];
        });
        setToast({ 
            title: "Item Escolhido", 
            message: `${product.name} foi adicionado à sua sacola.` 
        });
    };

    const removeFromCart = (productId: string) => {
        setCartItems(prev => prev.filter(p => p.id !== productId));
    };

    const cartTotal = cartItems.reduce((sum, p) => sum + (p.price || 0), 0);

    return (
        <PortalView 
            title="Bazar da Tribo" 
            subtitle="ALQUIMIA & CURA" 
            onBack={back}
            heroImage="https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=800"
        >
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            
            {state.isLoading ? (
                <div className="p-6 grid grid-cols-2 gap-4">
                    <ZenSkeleton variant="card" className="aspect-square" />
                    <ZenSkeleton variant="card" className="aspect-square" />
                    <ZenSkeleton variant="card" className="aspect-square" />
                    <ZenSkeleton variant="card" className="aspect-square" />
                </div>
            ) : (
                <div className="pb-32">
                    <MarketplaceExplorer onPurchase={handlePurchase} />
                </div>
            )}

            {/* Floating Cart Bar */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500">
                    <div className="bg-nature-900 rounded-[2rem] p-4 shadow-2xl shadow-nature-900/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <ShoppingBag size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">{cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}</p>
                                <p className="text-[10px] text-white/60 font-bold">R$ {cartTotal.toFixed(2).replace('.', ',')}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => go('CHECKOUT')}
                            className="px-6 py-3 bg-white text-nature-900 rounded-xl font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Sparkles size={14} /> Finalizar
                        </button>
                    </div>
                </div>
            )}
        </PortalView>
    );
};
