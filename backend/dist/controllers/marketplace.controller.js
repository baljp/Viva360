"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProducts = exports.createProduct = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const createProduct = async (req, res) => {
    const ownerId = req.user?.userId;
    const { name, price, category } = req.body;
    const product = await prisma_1.default.product.create({
        data: {
            name,
            price,
            category,
            owner_id: ownerId
        }
    });
    return res.json(product);
};
exports.createProduct = createProduct;
const listProducts = async (req, res) => {
    const products = await prisma_1.default.product.findMany();
    return res.json(products);
};
exports.listProducts = listProducts;
