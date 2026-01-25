import { Request, Response } from 'express';
import { supabaseAdmin, isMockMode } from '../services/supabase.service';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  specialty: z.array(z.string()).optional(),
});

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user; // Attached by middleware
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (isMockMode()) {
       return res.json({
         id: user.id || 'mock-id',
         name: user.name || 'Buscador Demo',
         email: user.email || 'mock@example.com',
         role: user.role || 'CLIENT', // Now this comes correctly from middleware
         avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
         karma: user.karma || 120,
         streak: user.streak || 5,
         multiplier: user.multiplier || 1.2,
         plantStage: user.plantStage || 'seed',
         plantXp: user.plantXp || 45,
         corporateBalance: user.corporateBalance || 0,
         personalBalance: user.personalBalance || 500,
         bio: user.bio || 'Perfil em Modo de Demonstração',
       });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const updates = updateProfileSchema.parse(req.body);

    if (isMockMode()) {
      return res.json({ ...updates, id: user.id, success: true });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(400).json({ error: error.message || 'Failed to update profile' });
  }
};

export const listProfiles = async (req: Request, res: Response) => {
    try {
        const role = req.query.role as string;
        
        if (isMockMode()) {
            // Mock listing
            return res.json([
                { id: 'pro1', name: 'Guardião Mock', role: 'PROFESSIONAL', specialty: ['Reiki'] },
                { id: 'pro2', name: 'Terapeuta Mock', role: 'PROFESSIONAL', specialty: ['Yoga'] }
            ]);
        }

        // Using Supabase/Prisma to filter profiles
        // Note: Profile table has 'role' column?
        // Checking Auth Service (Step 1170), Profile create has 'role'.
        // So we can filter by role.
        
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('role', role || 'PROFESSIONAL'); // Default to PRO search if undefined? Or list all?
            // If role is provided, filter. 
        
        if (role) {
             // The .eq above handles it.
             // But if role is undefined, we might want all?
             // Re-writing query logic slightly for robustness
        }

        let query = supabaseAdmin.from('profiles').select('*');
        if (role) query = query.eq('role', role);
        
        const { data: profiles, error: err } = await query;
        
        if (err) throw err;
        return res.json(profiles);

    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
