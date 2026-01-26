"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.listProducts = exports.createProduct = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const supabase_service_1 = require("../services/supabase.service");
const createProduct = async (req, res) => {
    const ownerId = req.user?.userId;
    const { name, price, category, type, image, description, eventDate, hostName, spotsLeft, karmaReward } = req.body;
    if ((0, supabase_service_1.isMockMode)()) {
        return res.status(201).json({
            id: 'mock-' + Date.now(),
            name,
            price,
            image: image || 'https://via.placeholder.com/150',
            category,
            type: type || 'PRODUCT',
            description,
            owner_id: ownerId || 'mock-owner',
            eventDate, // Mock handling extended fields
            hostName,
            spotsLeft,
            karmaReward
        });
    }
    // Note: Prisma Schema might need updates for eventDate/karmaReward if strictly relied upon.
    // For now, we map basic fields and potential JSON fields if schema allows, or ignore extra if strict.
    // Based on reading schema.prisma, only basic fields exist.
    // We will save basic fields. If DB supports JSON or extra columns, we'd add them.
    // Assuming 'description' can hold stringified JSON for extra metadata if needed, or just standard fields.
    const product = await prisma_1.default.product.create({
        data: {
            name,
            price: typeof price === 'string' ? parseFloat(price) : price,
            category,
            type,
            image,
            description,
            owner_id: ownerId
        }
    });
    return res.json(product);
};
exports.createProduct = createProduct;
const listProducts = async (req, res) => {
    const { ownerId } = req.query;
    if ((0, supabase_service_1.isMockMode)()) {
        let mocks = [
            { id: 'p1', name: 'Sessão Reiki', price: 150, category: 'Healing', type: 'service', image: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=400', owner_id: 'pro-1', karmaReward: 50 },
            { id: 'p2', name: 'Cristal Quartzo', price: 45, category: 'Minerals', type: 'physical', image: 'https://images.unsplash.com/photo-1596436647248-18545812971a?w=400', owner_id: 'space-1', karmaReward: 10, stock: 12 },
            { id: 'p3', name: 'Workshop Meditação', price: 200, category: 'Education', type: 'event', image: 'https://images.unsplash.com/photo-1591228127791-8e2eaef098d3?w=400', owner_id: 'space-1', eventDate: new Date().toISOString(), spotsLeft: 5 }
        ];
        if (ownerId) {
            mocks = mocks.filter(p => p.owner_id === ownerId);
        }
        return res.json(mocks);
    }
    const where = ownerId ? { owner_id: String(ownerId) } : {};
    const products = await prisma_1.default.product.findMany({ where });
    // Map Decimal to float for frontend
    const sanitized = products.map(p => ({
        ...p,
        price: Number(p.price)
    }));
    return res.json(sanitized);
};
exports.listProducts = listProducts;
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user?.userId; // In real app, verify ownership
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json({ success: true, id });
    }
    await prisma_1.default.product.delete({ where: { id } });
    return res.json({ success: true });
};
exports.deleteProduct = deleteProduct;
