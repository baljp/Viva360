import { profileRepository, UpdateProfileData } from '../repositories/profile.repository';

type ProfileUserRef = {
    id: string;
};

export class ProfileService {
    async getProfile(user: ProfileUserRef) {
        return await profileRepository.findById(user.id);
    }

    async updateProfile(user: ProfileUserRef, updates: UpdateProfileData) {
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
