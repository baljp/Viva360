"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.listNotifications = void 0;
const supabase_service_1 = require("../services/supabase.service");
const listNotifications = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        if ((0, supabase_service_1.isMockMode)()) {
            return res.json([
                { id: 'notif-1', title: 'Agendamento Confirmado', message: 'Sua sessão foi confirmada.', read: false, created_at: new Date().toISOString() },
                { id: 'notif-2', title: 'Bem-vindo!', message: 'Complete seu perfil para ganhar bônus.', read: true, created_at: new Date(Date.now() - 86400000).toISOString() }
            ]);
        }
        const { data, error } = await supabase_service_1.supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return res.json(data);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.listNotifications = listNotifications;
const markAsRead = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        if ((0, supabase_service_1.isMockMode)()) {
            return res.json({ success: true, id, read: true });
        }
        const { data, error } = await supabase_service_1.supabaseAdmin
            .from('notifications')
            .update({ read: true })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();
        if (error)
            throw error;
        return res.json(data);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
exports.markAsRead = markAsRead;
