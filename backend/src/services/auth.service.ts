import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { JWT_SECRET } from '../lib/secrets';
import { supabaseAdmin } from './supabase.service';

export class AuthService {
  
  // Register new user (creates Auth User + Profile via Trigger or manual)
  static async register(email: string, password: string, name: string, role: string = 'CLIENT') {

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('User already exists');

    const hashedPassword = (await bcrypt.hash(password, 10)).replace(/^\$2b\$/, '$2a$');

    // 1. Create User via Supabase SDK (Safe & Handles Identities/Triggers)
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create auth user');

    const userId = authData.user.id;

    // 2. Create Profile in Prisma (linked to Auth User)
    const profile = await prisma.profile.create({
      data: {
        id: userId,
        email: email,
        name: name,
        role: role,
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${userId}`,
        personal_balance: 1000,
        multiplier: 1,
      }
    });

    // Handle manual hash update if needed (Supabase SDK doesn't allow setting encrypted_password directly, 
    // but it hashes it correctly. We only need the prefix fix if we were inserting manually. 
    // Since we use signUp, it's already correct).
    
    return AuthService.generateSession({ id: userId, email });
  }

  // Login
  static async login(email: string, password: string) {

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
