import { marketplaceRepository, CreateProductData } from '../repositories/marketplace.repository';

export class MarketplaceService {
    async createProduct(data: CreateProductData & { eventDate?: string, hostName?: string, spotsLeft?: number, karmaReward?: number }) {
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

    async listProducts(ownerId?: string, category?: string) {
        const where: any = {};
        if (ownerId) where.owner_id = String(ownerId);
        if (category) {
            where.category = { equals: String(category), mode: 'insensitive' };
        }
        const products = await marketplaceRepository.findAll(where);
        
        return products.map(p => ({
            ...p,
            price: Number(p.price)
        }));
    }

    async deleteProduct(id: string) {
        await marketplaceRepository.delete(id);
        return { success: true };
    }

    async purchaseProduct(data: { product_id: string; amount: number; description: string; user_id: string }) {
        // TODO: Implement real payment logic (Prisma transaction)
        return { id: 'tx-real-placeholder', status: 'PENDING' };
    }
}

export const marketplaceService = new MarketplaceService();
