"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncToMobile = exports.createEvent = exports.getEvents = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const supabase_service_1 = require("../services/supabase.service");
const getEvents = async (req, res) => {
    const userId = req.user?.userId;
    if ((0, supabase_service_1.isMockMode)()) {
        const events = [
            { id: 'evt-1', title: 'Meditação Matinal', start_time: new Date().toISOString(), type: 'routine' },
            { id: 'evt-2', title: 'Sessão Terapia', start_time: new Date(Date.now() + 3600000).toISOString(), type: 'appointment' },
            { id: 'evt-3', title: 'Weekly Yoga', start_time: new Date().toISOString(), type: 'routine', recurrence: 'WEEKLY' }
        ];
        // UPGRADE: 9.3 Recurrence Logic
        // Simple expansion for Mock Mode
        const expanded = [...events];
        events.filter(e => e.recurrence === 'WEEKLY').forEach(e => {
            const nextWeek = new Date(e.start_time);
            nextWeek.setDate(nextWeek.getDate() + 7);
            expanded.push({ ...e, id: `${e.id}-next`, start_time: nextWeek.toISOString(), title: `${e.title} (Recurring)` });
        });
        return res.json(expanded);
    }
    const events = await prisma_1.default.calendarEvent.findMany({
        where: { user_id: userId },
        orderBy: { start_time: 'asc' }
    });
    return res.json(events);
};
exports.getEvents = getEvents;
const createEvent = async (req, res) => {
    const userId = req.user?.userId;
    const { title, start, end, type } = req.body;
    if ((0, supabase_service_1.isMockMode)()) {
        // Conflict Simulation: Reject appointments at 14:00
        const startDate = new Date(start);
        if (startDate.getHours() === 14) {
            return res.status(409).json({ error: 'Conflict detected: Time slot occupied' });
        }
        return res.status(201).json({
            id: 'mock-event-id',
            user_id: userId || 'mock-user',
            title,
            start_time: start,
            end_time: end,
            type
        });
    }
    const event = await prisma_1.default.calendarEvent.create({
        data: {
            user_id: userId,
            title,
            start_time: new Date(start),
            end_time: new Date(end),
            type
        }
    });
    return res.json(event);
};
exports.createEvent = createEvent;
const syncToMobile = async (req, res) => {
    const userId = req.user?.userId;
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json({ format: 'ics', data: 'BEGIN:VEVENT\nSUMMARY:Mock Event\nEND:VEVENT', sync_status: 'synced' });
    }
    const events = await prisma_1.default.calendarEvent.findMany({ where: { user_id: userId } });
    // Minimal ICS format simulation
    const icsData = events.map(e => `BEGIN:VEVENT\nSUMMARY:${e.title}\nDTSTART:${e.start_time.toISOString()}\nEND:VEVENT`).join('\n');
    return res.json({ format: 'ics', data: icsData, sync_status: 'synced' });
};
exports.syncToMobile = syncToMobile;
