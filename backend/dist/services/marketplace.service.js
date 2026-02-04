"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketplaceService = exports.MarketplaceService = void 0;
const marketplace_repository_1 = require("../repositories/marketplace.repository");
const supabase_service_1 = require("./supabase.service");
class MarketplaceService {
    async createProduct(data) {
        if ((0, supabase_service_1.isMockMode)()) {
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
        return await marketplace_repository_1.marketplaceRepository.create({
            name: data.name,
            price: data.price,
            category: data.category,
            type: data.type,
            image: data.image,
            description: data.description,
            owner_id: data.owner_id
        });
    }
    async listProducts(ownerId) {
        if ((0, supabase_service_1.isMockMode)()) {
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
        const products = await marketplace_repository_1.marketplaceRepository.findAll(where);
        return products.map(p => ({
            ...p,
            price: Number(p.price)
        }));
    }
    async deleteProduct(id) {
        if ((0, supabase_service_1.isMockMode)()) {
            return { success: true, id };
        }
        await marketplace_repository_1.marketplaceRepository.delete(id);
        return { success: true };
    }
    async purchaseProduct(data) {
        if ((0, supabase_service_1.isMockMode)()) {
            return {
                id: 'tx-mock-' + Date.now(),
                status: 'COMPLETED',
                ...data
            };
        }
        // In real mode, we would handle logic here (Prisma transaction for payment, etc.)
        return { id: 'tx-real-placeholder', status: 'PENDING' };
    }
}
exports.MarketplaceService = MarketplaceService;
exports.marketplaceService = new MarketplaceService();
