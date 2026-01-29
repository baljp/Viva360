import React, { useState } from 'react';
import { Product } from '../../types';
import { PortalView, ZenToast } from '../../components/Common';
import { useBuscadorFlow } from '../../src/flow/BuscadorFlowContext';
import { api } from '../../services/api';
import { MarketplaceExplorer } from '../../components/MarketplaceExplorer';

export const ClientMarketplace: React.FC = () => {
    const { go } = useBuscadorFlow();
    const [toast, setToast] = useState<{title: string, message: string} | null>(null);

    const handlePurchase = async (product: Product) => {
        try {
            const result = await api.payment.checkout(product.price, `Compra: ${product.name}`);
            if (result.success) {
                setToast({ 
                    title: "Compra Realizada", 
                    message: `Você adquiriu ${product.name} com sucesso!` 
                });
            }
        } catch (error) {
            setToast({ title: "Erro na Compra", message: "Não foi possível processar o pagamento." });
        }
    };

    return (
        <PortalView 
            title="Bazar da Tribo" 
            subtitle="ALQUIMIA & CURA" 
            onBack={() => go('DASHBOARD')}
            heroImage="https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=800"
        >
            {toast && <ZenToast toast={toast} onClose={() => setToast(null)} />}
            <MarketplaceExplorer onPurchase={handlePurchase} />
        </PortalView>
    );
};
