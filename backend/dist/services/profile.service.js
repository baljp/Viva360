"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileService = exports.ProfileService = void 0;
const profile_repository_1 = require("../repositories/profile.repository");
const supabase_service_1 = require("./supabase.service");
// Mock generator to keep Service clean
const getMockProfile = (user) => ({
    id: user.id || 'mock-id',
    name: user.name || 'Buscador Demo',
    email: user.email || 'mock@example.com',
    role: user.role || 'CLIENT',
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
class ProfileService {
    async getProfile(user) {
        if ((0, supabase_service_1.isMockMode)()) {
            return getMockProfile(user);
        }
        return await profile_repository_1.profileRepository.findById(user.id);
    }
    async updateProfile(user, updates) {
        if ((0, supabase_service_1.isMockMode)()) {
            return { ...updates, id: user.id, success: true };
        }
        return await profile_repository_1.profileRepository.update(user.id, updates);
    }
    async listProfiles(role) {
        if ((0, supabase_service_1.isMockMode)()) {
            return [
                { id: 'pro1', name: 'Guardião Mock', role: 'PROFESSIONAL', specialty: ['Reiki'] },
                { id: 'pro2', name: 'Terapeuta Mock', role: 'PROFESSIONAL', specialty: ['Yoga'] }
            ];
        }
        return await profile_repository_1.profileRepository.findAllByRole(role);
    }
}
exports.ProfileService = ProfileService;
exports.profileService = new ProfileService();
