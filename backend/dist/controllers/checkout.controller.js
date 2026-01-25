"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPayment = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const notifications_controller_1 = require("./notifications.controller");
const processPayment = async (req, res) => {
    const userId = req.user?.userId;
    const { amount, description, receiverId } = req.body;
    try {
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
                // Notify Receiver
                await (0, notifications_controller_1.sendPushSimulation)(receiverId, 'Payment Received', `You received ${amount} coins.`);
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
        // Notify Sender
        await (0, notifications_controller_1.sendPushSimulation)(userId, 'Payment Successful', `Spent ${amount} coins.`);
        return res.json(result);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
};
exports.processPayment = processPayment;
