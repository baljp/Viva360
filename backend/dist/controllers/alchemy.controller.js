"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOffers = exports.createOffer = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const async_middleware_1 = require("../middleware/async.middleware");
exports.createOffer = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const providerId = req.user?.userId;
    const { requesterId, description } = req.body;
    const offer = await prisma_1.default.swapOffer.create({
        data: {
            provider_id: providerId,
            requester_id: requesterId,
            description,
            status: 'pending'
        }
    });
    return res.json(offer);
});
exports.listOffers = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const offers = await prisma_1.default.swapOffer.findMany({
        where: {
            OR: [{ provider_id: userId }, { requester_id: userId }]
        }
    });
    return res.json(offers);
});
