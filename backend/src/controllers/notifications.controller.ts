import { Request, Response } from 'express';
import { supabaseAdmin, isMockMode } from '../services/supabase.service';

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (isMockMode()) {
      return res.json([
        { id: 'notif-1', title: 'Agendamento Confirmado', message: 'Sua sessão foi confirmada.', read: false, created_at: new Date().toISOString() },
        { id: 'notif-2', title: 'Bem-vindo!', message: 'Complete seu perfil para ganhar bônus.', read: true, created_at: new Date(Date.now() - 86400000).toISOString() }
      ]);
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (isMockMode()) {
       return res.json({ success: true, id, read: true });
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
