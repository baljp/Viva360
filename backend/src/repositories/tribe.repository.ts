import prisma from '../lib/prisma';

export interface InviteCreateData {
    hub_id: string;
    email: string;
    token: string;
    status: string;
}

export class TribeRepository {
    async findProfile(id: string) {
        return await prisma.profile.findUnique({ where: { id } });
    }

    async createInvite(data: InviteCreateData) {
        return await prisma.tribeInvite.create({
            data: {
                hub_id: data.hub_id,
                email: data.email,
                token: data.token,
                status: data.status
            }
        });
    }

    async findInvitesByHub(hubId: string) {
        return await prisma.tribeInvite.findMany({ where: { hub_id: hubId } });
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
