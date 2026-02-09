"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseProduct = exports.deleteProduct = exports.listProducts = exports.createProduct = void 0;
const async_middleware_1 = require("../middleware/async.middleware");
const marketplace_service_1 = require("../services/marketplace.service");
const prisma_1 = __importDefault(require("../lib/prisma"));
const supabase_service_1 = require("../services/supabase.service");
exports.createProduct = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const ownerId = req.user?.userId;
    const { name, price, category, type, image, description, eventDate, hostName, spotsLeft, karmaReward } = req.body;
    const product = await marketplace_service_1.marketplaceService.createProduct({
        name,
        price: typeof price === 'string' ? parseFloat(price) : price,
        category,
        type,
        image,
        description,
        owner_id: ownerId,
        // Extra fields passed for mock compatibility or future schema updates
        eventDate, hostName, spotsLeft, karmaReward
    });
    return res.json(product);
});
exports.listProducts = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const { ownerId } = req.query;
    const products = await marketplace_service_1.marketplaceService.listProducts(ownerId);
    return res.json(products);
});
exports.deleteProduct = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user?.userId;
    const role = String(req.user?.role || '').toUpperCase();
    if (!(0, supabase_service_1.isMockMode)() && role !== 'ADMIN') {
        const product = await prisma_1.default.product.findUnique({
            where: { id },
            select: { owner_id: true },
        });
        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado.' });
        }
        if (!product.owner_id || product.owner_id !== requesterId) {
            return res.status(403).json({ error: 'Você não pode remover este produto.' });
        }
    }
    const result = await marketplace_service_1.marketplaceService.deleteProduct(id);
    return res.json(result);
});
exports.purchaseProduct = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { product_id, amount, description } = req.body;
    const transaction = await marketplace_service_1.marketplaceService.purchaseProduct({
        product_id,
        amount,
        description,
        user_id: userId
    });
    return res.json(transaction);
});
