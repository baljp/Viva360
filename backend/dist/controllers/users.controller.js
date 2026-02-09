"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateById = exports.getById = exports.checkIn = void 0;
const async_middleware_1 = require("../middleware/async.middleware");
const supabase_service_1 = require("../services/supabase.service");
const zod_1 = require("zod");
const checkInSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    reward: zod_1.z.number().min(1).default(50)
});
const userUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    bio: zod_1.z.string().optional(),
    avatar: zod_1.z.string().url().optional(),
    location: zod_1.z.string().optional(),
    specialty: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.checkIn = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const { userId, reward } = checkInSchema.parse(req.body);
    // Validate user match
    if (req.user?.id !== userId) {
        return res.status(403).json({ error: 'Unauthorized check-in' });
    }
    // Update User Karma & Last Checkin
    const { data: user, error } = await supabase_service_1.supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error || !user) {
        return res.status(404).json({ error: 'User not found' });
    }
    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = user.last_check_in ? user.last_check_in.split('T')[0] : null;
    if (lastCheckIn === today) {
        return res.json({ user, reward: 0, message: 'Already checked in today' });
    }
    // Apply Reward
    const updates = {
        karma: (user.karma || 0) + reward,
        last_check_in: new Date().toISOString(),
        streak: (user.streak || 0) + 1
    };
    const { data: updatedUser, error: updateError } = await supabase_service_1.supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    if (updateError) {
        throw new Error('Failed to update user check-in');
    }
    return res.json({ user: updatedUser, reward });
});
exports.getById = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase_service_1.supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
    if (error || !data) {
        return res.status(404).json({ error: 'User not found' });
    }
    return res.json(data);
});
exports.updateById = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const parsed = userUpdateSchema.safeParse(req.body || {});
    const updates = parsed.success
        ? parsed.data
        : {
            name: req.body?.name,
            bio: req.body?.bio,
            avatar: req.body?.avatar,
            location: req.body?.location,
            specialty: Array.isArray(req.body?.specialty) ? req.body.specialty : undefined,
        };
    const sanitized = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));
    if (Object.keys(sanitized).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }
    const { data, error } = await supabase_service_1.supabaseAdmin
        .from('profiles')
        .update(sanitized)
        .eq('id', id)
        .select('*')
        .single();
    if (error || !data) {
        return res.status(404).json({ error: 'User not found or update failed' });
    }
    return res.json(data);
});
