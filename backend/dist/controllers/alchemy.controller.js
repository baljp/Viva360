"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOffers = exports.createOffer = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const supabase_service_1 = require("../services/supabase.service");
const createOffer = async (req, res) => {
    const providerId = req.user?.userId;
    const { requesterId, description } = req.body;
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json({
            id: 'mock-offer-id',
            provider_id: providerId || 'mock-pro',
            requester_id: requesterId || 'mock-client',
            description,
            status: 'pending'
        });
    }
    const offer = await prisma_1.default.swapOffer.create({
        data: {
            provider_id: providerId,
            requester_id: requesterId,
            description,
            status: 'pending'
        }
    });
    return res.json(offer);
};
exports.createOffer = createOffer;
const listOffers = async (req, res) => {
    const userId = req.user?.userId;
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json([
            { id: 'off-1', description: 'Troca de Reiki por Yoga', status: 'pending' }
        ]);
    }
    const offers = await prisma_1.default.swapOffer.findMany({
        where: {
            OR: [{ provider_id: userId }, { requester_id: userId }]
        }
    });
    return res.json(offers);
};
exports.listOffers = listOffers;
