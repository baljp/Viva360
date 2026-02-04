"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = exports.getSummary = void 0;
const async_middleware_1 = require("../middleware/async.middleware");
const finance_service_1 = require("../services/finance.service");
exports.getSummary = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const data = await finance_service_1.financeService.getSummary(userId);
    return res.json(data);
});
exports.getTransactions = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.userId;
    const transactions = await finance_service_1.financeService.getTransactions(userId);
    return res.json(transactions);
});
