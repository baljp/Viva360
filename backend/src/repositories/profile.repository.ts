import { supabaseAdmin } from '../services/supabase.service';

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

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', normalizedEmail)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
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

    async findAllByRole(role?: string) {
        let query = supabaseAdmin.from('profiles').select('*');
        if (role) query = query.eq('role', role);
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
}

export const profileRepository = new ProfileRepository();
