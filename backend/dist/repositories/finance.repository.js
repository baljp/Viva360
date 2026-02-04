"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeRepository = exports.FinanceRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma")); // Using Prisma for Finance still
class FinanceRepository {
    async getProfile(userId) {
        return await prisma_1.default.profile.findUnique({ where: { id: userId } });
    }
    async getTransactions(userId, limit = 20) {
        return await prisma_1.default.transaction.findMany({
            where: { user_id: userId },
            orderBy: { date: 'desc' },
            take: limit
        });
    }
}
exports.FinanceRepository = FinanceRepository;
exports.financeRepository = new FinanceRepository();
