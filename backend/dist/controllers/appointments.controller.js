"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppointment = exports.listAppointments = void 0;
const supabase_service_1 = require("../services/supabase.service");
const zod_1 = require("zod");
const async_middleware_1 = require("../middleware/async.middleware");
const createAppointmentSchema = zod_1.z.object({
    professional_id: zod_1.z.string().uuid().or(zod_1.z.string()), // Allow simple string for mock
    service_name: zod_1.z.string(),
    date: zod_1.z.string(),
    time: zod_1.z.string(),
    price: zod_1.z.number(),
});
exports.listAppointments = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: 'Unauthorized' });
    const { data, error } = await supabase_service_1.supabaseAdmin
        .from('appointments')
        .select('*')
        .or(`client_id.eq.${user.id},professional_id.eq.${user.id}`)
        .order('date', { ascending: false });
    if (error)
        throw error;
    return res.json(data);
});
exports.createAppointment = (0, async_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    if (!user)
        return res.status(401).json({ error: 'Unauthorized' });
    const payload = createAppointmentSchema.parse(req.body);
    // Date and Time Synchronization Logic
    const requestedDateTime = new Date(`${payload.date}T${payload.time}`);
    const now = new Date();
    if (requestedDateTime < now) {
        return res.status(400).json({
            error: 'Sincronização Falhou',
            message: 'O tempo flui apenas para frente. Escolha um momento no futuro.'
        });
    }
    const { data, error } = await supabase_service_1.supabaseAdmin
        .from('appointments')
        .insert({
        ...payload,
        client_id: user.id,
        status: 'pending'
    })
        .select()
        .single();
    if (error)
        throw error;
    return res.json(data);
});
