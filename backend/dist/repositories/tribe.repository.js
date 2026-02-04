"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tribeRepository = exports.TribeRepository = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class TribeRepository {
    async findProfile(id) {
        return await prisma_1.default.profile.findUnique({ where: { id } });
    }
    async createInvite(data) {
        return await prisma_1.default.tribeInvite.create({
            data: {
                hub_id: data.hub_id,
                email: data.email,
                token: data.token,
                status: data.status
            }
        });
    }
    async findInvitesByHub(hubId) {
        return await prisma_1.default.tribeInvite.findMany({ where: { hub_id: hubId } });
    }
    async findMembersByHub(hubId) {
        return await prisma_1.default.profile.findMany({
            where: {
                role: 'PROFESSIONAL',
                hub_id: hubId
            }
        });
    }
}
exports.TribeRepository = TribeRepository;
exports.tribeRepository = new TribeRepository();
