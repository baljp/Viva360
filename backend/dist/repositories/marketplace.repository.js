"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketplaceRepository = exports.MarketplaceRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class MarketplaceRepository {
    async create(data) {
        return await prisma_1.default.product.create({
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
    async findAll(where = {}) {
        return await prisma_1.default.product.findMany({ where });
    }
    async delete(id) {
        return await prisma_1.default.product.delete({ where: { id } });
    }
}
exports.MarketplaceRepository = MarketplaceRepository;
exports.marketplaceRepository = new MarketplaceRepository();
