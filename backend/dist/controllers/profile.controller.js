"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const supabase_service_1 = require("../services/supabase.service");
const zod_1 = require("zod");
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    bio: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    specialty: zod_1.z.array(zod_1.z.string()).optional(),
});
const getProfile = async (req, res) => {
    try {
        const user = req.user; // Attached by middleware
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        if ((0, supabase_service_1.isMockMode)()) {
            return res.json({
                id: user.id || 'mock-id',
                name: user.name || 'Buscador Demo',
                email: user.email || 'mock@example.com',
                role: user.role || 'CLIENT', // Now this comes correctly from middleware
                avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
                karma: user.karma || 120,
                streak: user.streak || 5,
                multiplier: user.multiplier || 1.2,
                plantStage: user.plantStage || 'seed',
                plantXp: user.plantXp || 45,
                corporateBalance: user.corporateBalance || 0,
                personalBalance: user.personalBalance || 500,
                bio: user.bio || 'Perfil em Modo de Demonstração',
            });
        }
        const { data, error } = await supabase_service_1.supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (error)
            throw error;
        return res.json(data);
    }
    catch (error) {
        return res.status(400).json({ error: error.message || 'Failed to fetch profile' });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        const updates = updateProfileSchema.parse(req.body);
        if ((0, supabase_service_1.isMockMode)()) {
            return res.json({ ...updates, id: user.id, success: true });
        }
        const { data, error } = await supabase_service_1.supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();
        if (error)
            throw error;
        return res.json(data);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(400).json({ error: error.message || 'Failed to update profile' });
    }
};
exports.updateProfile = updateProfile;
