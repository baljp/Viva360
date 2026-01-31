import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me';

export class AuthService {
  
  // Register new user (creates Auth User + Profile via Trigger or manual)
  static async register(email: string, password: string, name: string, role: string = 'CLIENT') {
    const { isMockMode } = await import('./supabase.service');
    if (isMockMode()) {
        return { user: { id: 'mock-' + Date.now(), email }, profile: { name, role } };
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Transaction to ensure auth + profile consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Auth User
      const user = await tx.user.create({
        data: {
          email,
          encrypted_password: hashedPassword,
        }
      });

      // 2. Create Profile (Manually, since trigger might be tricky with Prisma Raw)
      // Note: The SQL trigger 'on_auth_user_created' relies on raw SQL INSERTs. 
      // Prisma user.create might trigger it if we mapped it correctly.
      // But let's look at the trigger definition: 
      // It reads `new.raw_user_meta_data->>'name'`.
      // Our Prisma model for User doesn't populate `raw_user_meta_data`.
      // So we should create Profile manually here to be safe and explicit.
      
      const profile = await tx.profile.create({
        data: {
          id: user.id,
          email: user.email,
          name: name,
          role: role,
          avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${user.id}`,
          personal_balance: 1000, // Bonus
          multiplier: 1,
        }
      });

      return { user, profile };
    });

    return AuthService.generateSession(result.user);
  }

  // Login
  static async login(email: string, password: string) {
    const { isMockMode } = await import('./supabase.service');
    if (isMockMode()) {
        return AuthService.generateSession({ id: 'mock-session-id', email });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.encrypted_password) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.encrypted_password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return AuthService.generateSession(user);
  }

  // Helper: Generate Session Response
  private static generateSession(user: any) {
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: 'CLIENT' // We might need to fetch role from profile 
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      session: {
        access_token: token,
        refresh_token: 'mock-refresh-token', // Not implementing refresh flow heavily for stress test
      }
    };
  }

  // Update Password
  static async updatePassword(email: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return prisma.user.update({
      where: { email },
      data: { encrypted_password: hashedPassword }
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }
}
