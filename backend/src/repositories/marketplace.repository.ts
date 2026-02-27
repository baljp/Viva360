import prisma from '../lib/prisma';

export interface CreateProductData {
    name: string;
    price: number;
    category: string;
    type: string;
    image?: string;
    description?: string;
    owner_id: string;
}

export class MarketplaceRepository {
    async create(data: CreateProductData) {
        return await prisma.product.create({
            data: {
                name: data.name,
                price: data.price,
                category: data.category,
                type: data.type,
                image: data.image,
                description: data.description,
                owner_id: data.owner_id
            }
        });
    }

    async findAll(where: Record<string, unknown> = {}) {
        return await prisma.product.findMany({
            where,
            include: {
                owner: { select: { id: true, name: true, avatar: true, role: true, active_role: true } },
            },
        });
    }

    async delete(id: string) {
        return await prisma.product.delete({ where: { id } });
    }
}

export const marketplaceRepository = new MarketplaceRepository();
