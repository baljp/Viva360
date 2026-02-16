
import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { Search, ShoppingBag, Package, Star, Filter, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface MarketplaceExplorerProps {
    onPurchase: (product: Product) => void;
    onTrade?: (product: Product) => void;
    baseFilter?: string; // Optional default filter
}

export const MarketplaceExplorer: React.FC<MarketplaceExplorerProps> = React.memo(({ onPurchase, onTrade, baseFilter = 'all' }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState(baseFilter);

    useEffect(() => {
        loadMarketplace();
    }, []);

    const loadMarketplace = async () => {
        setIsLoading(true);
        try {
            const data = await api.marketplace.listAll();
            setProducts(data);
        } catch (error) {
            console.error("Failed to load marketplace", error);
        } finally {
            setIsLoading(false);
        }
    };

    const categories = useMemo(() => ['all', ...Array.from(new Set(products.map(p => p.category)))], [products]);

    const filteredProducts = useMemo(() => products.filter(p => 
        (activeFilter === 'all' || p.category.toLowerCase() === activeFilter.toLowerCase()) &&
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [products, activeFilter, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Search & Filter */}
            <div className="bg-white p-4 rounded-[2.5rem] border border-nature-100 shadow-sm space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-nature-300" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar itens sagrados..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-nature-50 border-none py-4 pl-12 pr-4 rounded-xl text-sm focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setActiveFilter(cat)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${activeFilter === cat ? 'bg-nature-900 text-white border-nature-900' : 'bg-white text-nature-400 border-nature-100'}`}
                        >
                            {cat === 'all' ? 'Tudo' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                    {[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse"/>)}
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-3 rounded-[2rem] border border-nature-100 shadow-sm group hover:shadow-md transition-all flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="relative aspect-square rounded-[1.5rem] overflow-hidden bg-nature-50">
                                    <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={product.name || 'Produto'} />
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm">
                                        {product.type === 'physical' ? <Package size={12} className="text-nature-900"/> : <Star size={12} className="text-amber-500 fill-amber-500"/>}
                                    </div>
                                </div>
                                <div className="px-1">
                                    <h4 className="font-bold text-nature-900 text-[11px] leading-tight line-clamp-2 break-words h-8">{product.name}</h4>
                                    <p className="text-[9px] text-nature-400 font-bold uppercase tracking-widest mt-1 truncate">{product.category}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between px-1">
                                <span className="text-sm font-bold text-nature-900">R$ {product.price}</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => onPurchase(product)}
                                        className="p-2 bg-nature-900 text-white rounded-xl active:scale-95 transition-all shadow-lg hover:bg-black"
                                    >
                                        <ShoppingBag size={14} />
                                    </button>
                                     <button 
                                        onClick={() => onTrade && onTrade(product)}
                                        className="p-2 bg-indigo-50 text-indigo-600 rounded-xl active:scale-95 transition-all shadow-sm border border-indigo-100 hover:bg-indigo-100"
                                        title="Propor Troca"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center opacity-40 space-y-4">
                    <ShoppingBag size={48} className="mx-auto text-nature-300" />
                    <p className="italic text-sm">Nenhum item encontrado.</p>
                </div>
            )}
        </div>
    );
});
