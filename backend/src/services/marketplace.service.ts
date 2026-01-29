import { marketplaceRepository, CreateProductData } from '../repositories/marketplace.repository';
import { isMockMode } from './supabase.service';

export class MarketplaceService {
    async createProduct(data: CreateProductData & { eventDate?: string, hostName?: string, spotsLeft?: number, karmaReward?: number }) {
        if (isMockMode()) {
            return {
                id: 'mock-' + Date.now(),
                ...data,
                image: data.image || 'https://via.placeholder.com/150',
                type: data.type || 'PRODUCT',
            };
        }
        
        // Note: Extra fields like eventDate are not in Prisma schema yet? 
        // Controller passed them to mock but ignored them in Prisma create.
        // Keeping behavior consistent: only pass schema fields to repo.
        return await marketplaceRepository.create({
            name: data.name,
            price: data.price,
            category: data.category,
            type: data.type,
            image: data.image,
            description: data.description,
            owner_id: data.owner_id
        });
    }

    async listProducts(ownerId?: string) {
        if (isMockMode()) {
            let mocks = [
                { id: 'p1', name: 'Sessão Reiki', price: 150, category: 'Healing', type: 'service', image: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=400', owner_id: 'pro-1', karmaReward: 50 },
                { id: 'p2', name: 'Cristal Quartzo', price: 45, category: 'Minerals', type: 'physical', image: 'https://images.unsplash.com/photo-1596436647248-18545812971a?w=400', owner_id: 'space-1', karmaReward: 10, stock: 12 },
                { id: 'p3', name: 'Workshop Meditação', price: 200, category: 'Education', type: 'event', image: 'https://images.unsplash.com/photo-1591228127791-8e2eaef098d3?w=400', owner_id: 'space-1', eventDate: new Date().toISOString(), spotsLeft: 5 }
            ];
            
            if (ownerId) {
                mocks = mocks.filter(p => p.owner_id === ownerId);
            }
            return mocks;
        }

        const where = ownerId ? { owner_id: String(ownerId) } : {};
        const products = await marketplaceRepository.findAll(where);
        
        return products.map(p => ({
            ...p,
            price: Number(p.price)
        }));
    }

    async deleteProduct(id: string) {
        if (isMockMode()) {
            return { success: true, id };
        }
        await marketplaceRepository.delete(id);
        return { success: true };
    }
}

export const marketplaceService = new MarketplaceService();
