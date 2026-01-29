import { tribeRepository, InviteCreateData } from '../repositories/tribe.repository';
import { isMockMode } from './supabase.service';
import crypto from 'crypto';

export class TribeService {
    async inviteMember(hubId: string, email: string) {
        if (isMockMode()) {
            return {
                id: 'mock-invite-id',
                hub_id: hubId || 'mock-space',
                email,
                token: 'mock-invite-token',
                status: 'pending'
            };
        }

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
        if (isMockMode()) {
            return [
                { id: 'inv-1', email: 'pro@test.com', status: 'pending' },
                { id: 'inv-2', email: 'healer@test.com', status: 'accepted' }
            ];
        }
        return await tribeRepository.findInvitesByHub(hubId);
    }

    async listMembers(hubId: string) {
        if (isMockMode()) {
            return [
                { id: 'pro-1', name: 'Ana Luz', role: 'PROFESSIONAL', specialty: ['Reiki'], hubId },
                { id: 'pro-2', name: 'João Sol', role: 'PROFESSIONAL', specialty: ['Yoga'], hubId }
            ];
        }
        return await tribeRepository.findMembersByHub(hubId);
    }

    async joinTribe(proId: string, vacancyId: string) {
        if (isMockMode()) {
            return {
                success: true,
                message: 'Application sent (Mock)',
                proId,
                vacancyId
            };
        }
        // Improve: Connect to vacancy logic. For now, simple ack
        return { success: true, message: 'Application received' };
    }
}

export const tribeService = new TribeService();
