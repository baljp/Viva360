import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export interface InviteCreateData {
    hub_id: string;
    email: string;
    token: string;
    status: string;
    invite_type?: string;
    target_role?: string | null;
    context_ref?: string | null;
    expires_at?: Date | null;
}

type TribeInviteCreateCompatData = {
    hub_id: string;
    email: string;
    token: string;
    status: string;
    invite_type?: string;
    target_role?: string | null;
    context_ref?: string | null;
    expires_at?: Date | null;
};

type TribeInviteUpdateCompatData = Partial<{
    email: string;
    token: string;
    status: string;
    invite_type: string;
    target_role: string | null;
    context_ref: string | null;
    expires_at: Date | null;
    responded_at: Date | null;
}>;

const isMissingInviteColumnError = (error: unknown) => (error as { code?: string })?.code === 'P2022';

export class TribeRepository {
    async findProfile(id: string) {
        return await prisma.profile.findUnique({ where: { id } });
    }

    async createInvite(data: InviteCreateData) {
        try {
            return await prisma.tribeInvite.create({
                data: {
                    hub_id: data.hub_id,
                    email: data.email,
                    token: data.token,
                    status: data.status,
                    invite_type: data.invite_type || 'TEAM',
                    target_role: data.target_role || null,
                    context_ref: data.context_ref || null,
                    expires_at: data.expires_at || null,
                }
            });
        } catch (error) {
            if (isMissingInviteColumnError(error)) {
                const fallbackData: TribeInviteCreateCompatData = {
                    hub_id: data.hub_id,
                    email: data.email,
                    token: data.token,
                    status: data.status,
                };
                return await prisma.tribeInvite.create({
                    data: fallbackData as Prisma.TribeInviteUncheckedCreateInput,
                });
            }
            throw error;
        }
    }

    async findInvitesByHub(hubId: string) {
        return await prisma.tribeInvite.findMany({ where: { hub_id: hubId } });
    }

    async findInviteById(id: string) {
        return await prisma.tribeInvite.findUnique({ where: { id } });
    }

    async updateInvite(id: string, data: TribeInviteUpdateCompatData) {
        try {
            return await prisma.tribeInvite.update({
                where: { id },
                data,
            });
        } catch (error) {
            if (isMissingInviteColumnError(error)) {
                const { responded_at, expires_at, invite_type, target_role, context_ref, ...sanitized } = data;
                return await prisma.tribeInvite.update({
                    where: { id },
                    data: sanitized,
                });
            }
            throw error;
        }
    }

    async findMembersByHub(hubId: string) {
        return await prisma.profile.findMany({ 
            where: { 
                role: 'PROFESSIONAL',
                hub_id: hubId 
            } 
        });
    }
}

export const tribeRepository = new TribeRepository();
