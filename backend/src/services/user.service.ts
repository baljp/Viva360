import prisma from '../config/database';
import { AppError } from '../middleware/error';

export class UserService {

    // Get User Profile (Self)
    async getMe(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { professional: true, space: true }
        });

        if (!user) throw new AppError('Usuário não encontrado', 404);

        // Remove sensitive data
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // Get User Public Profile
    async getUserProfile(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            include: { professional: true, space: true }
        });

        if (!user) throw new AppError('Usuário não encontrado', 404);

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // Update User Profile
    async updateUserProfile(userId: string, updates: any) {
        // Security filter
        delete updates.password;
        delete updates.email;
        delete updates.role;
        delete updates.karma; // Gamification integrity

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updates,
            include: { professional: true, space: true }
        });

        const { password: _, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }

    // Gamification: Daily Check-in
    async performCheckIn(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError('Usuário não encontrado', 404);

        const today = new Date().toISOString().split('T')[0];
        const lastCheckIn = user.lastCheckIn?.toISOString().split('T')[0];

        if (lastCheckIn === today) {
            throw new AppError('Check-in já realizado hoje', 400);
        }

        const reward = 50;
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                karma: user.karma + reward,
                streak: user.streak + 1,
                lastCheckIn: new Date(),
                plantXp: user.plantXp + 10,
            },
        });

        return { 
            message: 'Check-in realizado com sucesso!', 
            reward, 
            user: updatedUser 
        };
    }
}

export const userService = new UserService();
