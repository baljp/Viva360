"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPayment = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const notifications_controller_1 = require("./notifications.controller");
const supabase_service_1 = require("../services/supabase.service");
const async_middleware_1 = require("../middleware/async.middleware");
exports.processPayment = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const { amount, description, receiverId, items } = req.body; // items: [{ id, price, type }]
    if ((0, supabase_service_1.isMockMode)()) {
        // Simulate Cart Checkout
        const total = items ? items.reduce((acc, item) => acc + item.price, 0) : amount;
        // UPGRADE: 9.2 Inventory Logic
        if (items) {
            console.log(`   📉 [INVENTORY] Deducting stock for ${items.length} items...`);
            items.forEach((i) => console.log(`      - Item ${i.id}: Stock -1`));
        }
        return res.json({
            id: 'mock-tx-cart-id',
            user_id: userId || 'mock-sender',
            type: 'expense',
            amount: total,
            description: description || `Checkout (${items?.length || 1} items)`,
            items: items || [],
            status: 'completed',
            fulfillment: items?.map((i) => ({ itemId: i.id, status: 'fulfilled', type: i.type })) || [],
            created_at: new Date().toISOString()
        });
    }
    const result = await prisma_1.default.$transaction(async (tx) => {
        // 1. Check Sender Balance
        const sender = await tx.profile.findUnique({ where: { id: userId } });
        if (!sender || sender.personal_balance.toNumber() < amount) {
            throw new Error('Insufficient funds');
        }
        // 2. Debit Sender
        await tx.profile.update({
            where: { id: userId },
            data: {
                personal_balance: { decrement: amount },
                karma: { increment: amount * 2 } // Gamification hook
            }
        });
        // 3. Credit Receiver (if any)
        if (receiverId) {
            await tx.profile.update({
                where: { id: receiverId },
                data: { personal_balance: { increment: amount } }
            });
            // Debiting and Crediting done in transaction
        }
        // 4. Create Transaction Record
        return await tx.transaction.create({
            data: {
                user_id: userId,
                type: 'expense',
                amount: amount,
                description: description || 'Checkout Payment',
            }
        });
    });
    // 5. Post-Commit Actions (Notifications)
    if (receiverId) {
        // Notify Receiver (Async/Fire-and-forget or awaited outside tx)
        await (0, notifications_controller_1.sendPushSimulation)(receiverId, 'Payment Received', `You received ${amount} coins.`);
    }
    // Notify Sender
    await (0, notifications_controller_1.sendPushSimulation)(userId, 'Payment Successful', `Spent ${amount} coins.`);
    return res.json(result);
});
