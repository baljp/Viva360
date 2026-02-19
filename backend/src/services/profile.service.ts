import { profileRepository, UpdateProfileData } from '../repositories/profile.repository';

export class ProfileService {
    async getProfile(user: any) {
        return await profileRepository.findById(user.id);
    }

    async updateProfile(user: any, updates: UpdateProfileData) {
        return await profileRepository.update(user.id, updates);
    }

    async listProfiles(role?: string) {
        return await profileRepository.findAllByRole(role);
    }

    async lookupByEmail(email: string) {
        return await profileRepository.findByEmail(email);
    }
}

export const profileService = new ProfileService();
