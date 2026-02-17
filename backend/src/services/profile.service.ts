import { profileRepository, UpdateProfileData } from '../repositories/profile.repository';
import { isMockMode } from './supabase.service';

// Mock generator to keep Service clean
const getMockProfile = (user: any) => ({
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

export class ProfileService {
    async getProfile(user: any) {
        if (isMockMode()) {
            return getMockProfile(user);
        }
        return await profileRepository.findById(user.id);
    }

    async updateProfile(user: any, updates: UpdateProfileData) {
        if (isMockMode()) {
            return { ...updates, id: user.id, success: true };
        }
        return await profileRepository.update(user.id, updates);
    }

    async listProfiles(role?: string) {
        if (isMockMode()) {
            return [
                { id: 'pro1', name: 'Guardião Mock', role: 'PROFESSIONAL', specialty: ['Reiki'] },
                { id: 'pro2', name: 'Terapeuta Mock', role: 'PROFESSIONAL', specialty: ['Yoga'] }
            ];
        }
        return await profileRepository.findAllByRole(role);
    }

    async lookupByEmail(email: string) {
        if (isMockMode()) {
            return null;
        }
        return await profileRepository.findByEmail(email);
    }
}

export const profileService = new ProfileService();
