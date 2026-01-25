"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncToMobile = exports.createEvent = exports.getEvents = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getEvents = async (req, res) => {
    const userId = req.user?.userId;
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
    const events = await prisma_1.default.calendarEvent.findMany({ where: { user_id: userId } });
    // Minimal ICS format simulation
    const icsData = events.map(e => `BEGIN:VEVENT\nSUMMARY:${e.title}\nDTSTART:${e.start_time.toISOString()}\nEND:VEVENT`).join('\n');
    return res.json({ format: 'ics', data: icsData, sync_status: 'synced' });
};
exports.syncToMobile = syncToMobile;
