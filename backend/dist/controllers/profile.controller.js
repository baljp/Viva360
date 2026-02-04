"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProfiles = exports.updateProfile = exports.getProfile = void 0;
const zod_1 = require("zod");
const async_middleware_1 = require("../middleware/async.middleware");
const profile_service_1 = require("../services/profile.service");
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    bio: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    specialty: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.getProfile = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: 'Unauthorized' });
    const data = await profile_service_1.profileService.getProfile(user);
    return res.json(data);
});
exports.updateProfile = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: 'Unauthorized' });
    const updates = updateProfileSchema.parse(req.body);
    const data = await profile_service_1.profileService.updateProfile(user, updates);
    return res.json(data);
});
exports.listProfiles = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const role = req.query.role;
    const profiles = await profile_service_1.profileService.listProfiles(role);
    return res.json(profiles);
});
