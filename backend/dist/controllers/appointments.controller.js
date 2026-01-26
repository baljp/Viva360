"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppointment = exports.listAppointments = void 0;
const supabase_service_1 = require("../services/supabase.service");
const zod_1 = require("zod");
const createAppointmentSchema = zod_1.z.object({
    professional_id: zod_1.z.string().uuid().or(zod_1.z.string()), // Allow simple string for mock
    service_name: zod_1.z.string(),
    date: zod_1.z.string(),
    time: zod_1.z.string(),
    price: zod_1.z.number(),
});
const listAppointments = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        if ((0, supabase_service_1.isMockMode)()) {
            return res.json([
                {
                    id: 'mock-appt-1',
                    service_name: 'Psicoterapia',
                    professional_name: 'Dra. Ana Silva',
                    date: new Date().toISOString(),
                    time: '14:00',
                    price: 150.0,
                    status: 'confirmed',
                },
                {
                    id: 'mock-appt-2',
                    service_name: 'Yoga Class',
                    professional_name: 'Studio Zen',
                    date: new Date(Date.now() + 86400000).toISOString(),
                    time: '10:00',
                    price: 50.0,
                    status: 'pending',
                }
            ]);
        }
        const { data, error } = await supabase_service_1.supabaseAdmin
            .from('appointments')
            .select('*')
            .or(`client_id.eq.${user.id},professional_id.eq.${user.id}`)
            .order('date', { ascending: false });
        if (error)
            throw error;
        return res.json(data);
    }
    catch (error) {
        return res.status(400).json({ error: error.message || 'Failed to fetch appointments' });
    }
};
exports.listAppointments = listAppointments;
const createAppointment = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        const payload = createAppointmentSchema.parse(req.body);
        if ((0, supabase_service_1.isMockMode)()) {
            return res.json({
                id: 'mock-new-appt',
                ...payload,
                client_id: user.id,
                status: 'pending',
                created_at: new Date().toISOString(),
            });
        }
        const { data, error } = await supabase_service_1.supabaseAdmin
            .from('appointments')
            .insert({
            ...payload,
            client_id: user.id,
        })
            .select()
            .single();
        if (error)
            throw error;
        return res.json(data);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(400).json({ error: error.message || 'Failed to create appointment' });
    }
};
exports.createAppointment = createAppointment;
