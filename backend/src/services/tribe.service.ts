import { tribeRepository, InviteCreateData } from '../repositories/tribe.repository';
import crypto from 'crypto';

export class TribeService {
    async inviteMember(hubId: string, email: string) {

        // Domain Logic: Only SPACE can invite
        const hub = await tribeRepository.findProfile(hubId);
        if (hub?.role !== 'SPACE') {
            throw new Error('Only Sanctuaries can invite team members'); // Should be 403, handled by consumer or error middleware
        }

        const token = crypto.randomBytes(16).toString('hex');
        const invite = await tribeRepository.createInvite({
            hub_id: hubId,
            email,
            token,
            status: 'pending'
        });

        // Mock Email
        console.log(`[EMAIL] Invite sent to ${email} with token ${token}`);
        
        return invite;
    }

    async listInvites(hubId: string) {
        return await tribeRepository.findInvitesByHub(hubId);
    }

    async listMembers(hubId: string) {
        return await tribeRepository.findMembersByHub(hubId);
    }

    async joinTribe(proId: string, vacancyId: string) {
        // Improve: Connect to vacancy logic. For now, simple ack
        return { success: true, message: 'Application received' };
    }
}

export const tribeService = new TribeService();
