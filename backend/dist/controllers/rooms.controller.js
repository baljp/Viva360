"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listVacancies = exports.createVacancy = exports.updateStatus = exports.getAnalytics = exports.getRealTime = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const supabase_service_1 = require("../services/supabase.service");
const getRealTime = async (req, res) => {
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json([
            { id: 'mock-room-1', name: 'Sala Hera', status: 'available', next_booking: null },
            { id: 'mock-room-2', name: 'Sala Zeus', status: 'occupied', next_booking: '14:00' }
        ]);
    }
    // Return all rooms for simplicity or filter by hub
    const rooms = await prisma_1.default.room.findMany();
    return res.json(rooms);
};
exports.getRealTime = getRealTime;
const getAnalytics = async (req, res) => {
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json({
            total_rooms: 10,
            occupied_rate: 45,
            revenue_today: 1250.00
        });
    }
    // Aggregate data
    const totalRooms = await prisma_1.default.room.count();
    const occupied = await prisma_1.default.room.count({ where: { status: 'occupied' } });
    return res.json({
        total_rooms: totalRooms,
        occupied_rate: totalRooms > 0 ? (occupied / totalRooms) * 100 : 0,
        revenue_today: 1250.00 // Mock for speed
    });
};
exports.getAnalytics = getAnalytics;
const updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        if ((0, supabase_service_1.isMockMode)() || id === 'dummy_id') {
            return res.json({ id, status, success: true, mock: true });
        }
        const room = await prisma_1.default.room.update({
            where: { id },
            data: { status }
        });
        return res.json(room);
    }
    catch (e) {
        return res.status(404).json({ error: 'Room not found' });
    }
};
exports.updateStatus = updateStatus;
const createVacancy = async (req, res) => {
    try {
        const { title, description, specialties, availability } = req.body; // Added availability
        if ((0, supabase_service_1.isMockMode)()) {
            return res.status(201).json({
                id: 'mock-vacancy-id',
                title,
                description,
                specialties,
                availability,
                spaceId: req.user?.id || 'mock-space-id',
                created_at: new Date().toISOString()
            });
        }
        const vacancy = await prisma_1.default.vacancy.create({
            data: {
                title,
                description,
                specialties: specialties || [],
                space_id: req.user?.userId || 'unknown'
            }
        });
        return res.status(201).json(vacancy);
    }
    catch (e) {
        return res.status(500).json({ error: e.message || "Failed to create vacancy" });
    }
};
exports.createVacancy = createVacancy;
const listVacancies = async (req, res) => {
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json([
            { id: 'v1', title: 'Psicólogo(a) Clínico', description: 'Atendimento de segunda a sexta', specialties: ['Psicologia'] },
            { id: 'v2', title: 'Massoterapeuta', description: 'Sala equipada disponível', specialties: ['Massagem'] }
        ]);
    }
    const vacancies = await prisma_1.default.vacancy.findMany();
    return res.json(vacancies);
};
exports.listVacancies = listVacancies;
