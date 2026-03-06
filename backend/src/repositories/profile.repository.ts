import { supabaseAdmin } from '../services/supabase.service';
import prisma from '../lib/prisma';
import { getMockProfile, getMockProfileByEmail, isMockMode, listMockProfiles, saveMockProfile } from '../services/mockAdapter';

export interface UpdateProfileData {
    name?: string;
    bio?: string;
    location?: string;
    specialty?: string[];
}

export class ProfileRepository {
    async findById(id: string) {
        if (isMockMode()) {
            return getMockProfile(id);
        }

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

        if (isMockMode()) {
            return getMockProfileByEmail(normalizedEmail);
        }

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
        if (isMockMode()) {
            const current = getMockProfile(id);
            if (!current) return null;
            return saveMockProfile({
                ...current,
                ...(updates.name !== undefined ? { name: updates.name } : {}),
                ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
                ...(updates.location !== undefined ? { location: updates.location } : {}),
                ...(updates.specialty !== undefined ? { specialty: updates.specialty } : {}),
            });
        }

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
        if (isMockMode()) {
            const normalizedQuery = String(query || '').trim().toLowerCase();
            return listMockProfiles().filter((profile) =>
                String(profile.name || '').trim().toLowerCase().includes(normalizedQuery)
            ).slice(0, 20);
        }

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, name, avatar, role')
            .ilike('name', `%${query}%`)
            .limit(20);
        if (error) throw error;
        return data || [];
    }

    async findAllByRole(role?: string) {
        if (isMockMode()) {
            return listMockProfiles(role);
        }

        let query = supabaseAdmin.from('profiles').select('*');
        if (role) query = query.eq('role', role);
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
}

export const profileRepository = new ProfileRepository();
