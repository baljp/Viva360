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
        } catch (error: any) {
            if (error?.code === 'P2022') {
                return await prisma.tribeInvite.create({
                    data: {
                        hub_id: data.hub_id,
                        email: data.email,
                        token: data.token,
                        status: data.status,
                    } as any,
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

    async updateInvite(id: string, data: Record<string, unknown>) {
        try {
            return await prisma.tribeInvite.update({
                where: { id },
                data: data as any,
            });
        } catch (error: any) {
            if (error?.code === 'P2022') {
                const sanitized = { ...data };
                delete (sanitized as any).responded_at;
                delete (sanitized as any).expires_at;
                delete (sanitized as any).invite_type;
                delete (sanitized as any).target_role;
                delete (sanitized as any).context_ref;
                return await prisma.tribeInvite.update({
                    where: { id },
                    data: sanitized as any,
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
