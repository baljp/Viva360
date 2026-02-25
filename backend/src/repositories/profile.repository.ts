import { supabaseAdmin } from '../services/supabase.service';
import prisma from '../lib/prisma';

export interface UpdateProfileData {
    name?: string;
    bio?: string;
    location?: string;
    specialty?: string[];
}

export class ProfileRepository {
    async findById(id: string) {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            // Handle expected "not found" or rethrow
             if (error.code === 'PGRST116') return null; // PostgREST code for JSON "no matching row"
             throw error;
        }
        return data;
    }

    async findByEmail(email: string) {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        if (!normalizedEmail) return null;

        // Prefer profile.email when present, but do a case-insensitive match to avoid
        // "email exists but not found" issues due to casing differences.
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .ilike('email', normalizedEmail)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Fallback: some deployments do not persist profile.email; resolve via auth.users.email.
                const user = await prisma.user.findFirst({
                    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
                    select: { id: true },
                });
                if (!user?.id) return null;
                return await this.findById(String(user.id));
            }
            throw error;
        }
        return data;
    }

    async update(id: string, updates: UpdateProfileData) {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async searchByName(query: string) {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, name, avatar, role')
            .ilike('name', `%${query}%`)
            .limit(20);
        if (error) throw error;
        return data || [];
    }

    async findAllByRole(role?: string) {
        let query = supabaseAdmin.from('profiles').select('*');
        if (role) query = query.eq('role', role);
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
}

export const profileRepository = new ProfileRepository();
