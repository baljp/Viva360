"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPurchase = exports.listProducts = void 0;
const supabase_service_1 = require("../services/supabase.service");
const zod_1 = require("zod");
const purchaseSchema = zod_1.z.object({
    product_id: zod_1.z.string(),
    amount: zod_1.z.number().positive(),
    description: zod_1.z.string(),
});
const listProducts = async (req, res) => {
    try {
        if ((0, supabase_service_1.isMockMode)()) {
            return res.json([
                { id: 'prod-1', name: 'Cristal Curativo', price: 50.0, category: 'Cristais', image: 'https://placehold.co/400' },
                { id: 'prod-2', name: 'Tapete Yoga', price: 120.0, category: 'Acessórios', image: 'https://placehold.co/400' },
            ]);
        }
        const { data, error } = await supabase_service_1.supabaseAdmin.from('products').select('*');
        if (error)
            throw error;
        return res.json(data);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.listProducts = listProducts;
const processPurchase = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { product_id, amount, description } = purchaseSchema.parse(req.body);
        if ((0, supabase_service_1.isMockMode)()) {
            // Stimulate balance check
            if (amount > 5000) {
                return res.status(400).json({ error: 'Insufficient funds (Mock)' });
            }
            return res.json({
                success: true,
                transaction_id: 'mock-tx-123',
                new_balance: 950.0, // Mock deduction
                message: 'Purchase successful'
            });
        }
        // Call the complex Postgres function via RPC
        const { data, error } = await supabase_service_1.supabaseAdmin.rpc('process_payment', {
            amount,
            description,
            receiver_id: null // Ideally we'd look up product owner here
        });
        if (error)
            throw error;
        return res.json(data);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(400).json({ error: error.message || 'Transaction failed' });
    }
};
exports.processPurchase = processPurchase;
