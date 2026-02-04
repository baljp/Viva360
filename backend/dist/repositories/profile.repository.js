"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRepository = exports.ProfileRepository = void 0;
const supabase_service_1 = require("../services/supabase.service");
class ProfileRepository {
    async findById(id) {
        const { data, error } = await supabase_service_1.supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        if (error) {
            // Handle expected "not found" or rethrow
            if (error.code === 'PGRST116')
                return null; // PostgREST code for JSON "no matching row"
            throw error;
        }
        return data;
    }
    async update(id, updates) {
        const { data, error } = await supabase_service_1.supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async findAllByRole(role) {
        let query = supabase_service_1.supabaseAdmin.from('profiles').select('*');
        if (role)
            query = query.eq('role', role);
        const { data, error } = await query;
        if (error)
            throw error;
        return data;
    }
}
exports.ProfileRepository = ProfileRepository;
exports.profileRepository = new ProfileRepository();
