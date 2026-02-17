import { tribeRepository, InviteCreateData } from '../repositories/tribe.repository';
import crypto from 'crypto';
import { interactionService } from './interaction.service';
import { logger } from '../lib/logger';

export class TribeService {
    async inviteMember(hubId: string, email: string, options?: { inviteType?: string; targetRole?: string; expiresAt?: Date | null; contextRef?: string | null }) {

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
            status: 'pending',
            invite_type: String(options?.inviteType || 'TEAM').toUpperCase(),
            target_role: options?.targetRole ? String(options.targetRole).toUpperCase() : null,
            expires_at: options?.expiresAt || null,
            context_ref: options?.contextRef || null,
        });

        try {
            await interactionService.emitTribeInvite({
                hubId,
                email,
                inviteId: invite.id,
            });
        } catch (error) {
            interactionService.logInteractionFailure('tribe.invite', error, { hubId, email });
        }

        // Mock email dispatch. Token is considered sensitive and will be redacted by logger.
        logger.info('tribe.invite_created', { hubId, email, token, inviteId: invite.id });
        
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

    async respondInvite(inviteId: string, decision: 'ACCEPT' | 'REJECT', actorEmail?: string) {
        const invite = await tribeRepository.findInviteById(inviteId);
        if (!invite) {
            throw new Error('Invite not found');
        }

        if (invite.status !== 'pending') {
            throw new Error('Invite is not pending');
        }

        if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
            const expired = await tribeRepository.updateInvite(inviteId, {
                status: 'expired',
                responded_at: new Date(),
            });
            return expired;
        }

        if (actorEmail && String(invite.email || '').toLowerCase() !== String(actorEmail || '').toLowerCase()) {
            throw new Error('Invite does not belong to this email');
        }

        const status = decision === 'ACCEPT' ? 'accepted' : 'rejected';
        return tribeRepository.updateInvite(inviteId, {
            status,
            responded_at: new Date(),
        });
    }
}

export const tribeService = new TribeService();
