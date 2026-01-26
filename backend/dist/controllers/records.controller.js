"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportData = exports.grantAccess = exports.listNotes = exports.createNote = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const supabase_service_1 = require("../services/supabase.service");
const audit_service_1 = require("../services/audit.service");
const createNote = async (req, res) => {
    const proId = req.user?.userId;
    const { patientId, content, type } = req.body; // type: 'anamnesis' | 'session'
    // 1. Audit Attempt
    await audit_service_1.AuditService.logAccess(proId, `patient:${patientId}`, 'WRITE_RECORD', 'SUCCESS', `Type: ${type}`);
    if ((0, supabase_service_1.isMockMode)()) {
        try {
            const record = await prisma_1.default.record.create({
                data: {
                    patient_id: patientId,
                    professional_id: proId,
                    content,
                    type
                }
            });
            return res.status(201).json(record);
        }
        catch (e) {
            console.error("DB Error:", e);
            // Fallback to mock if DB fails (SAFE MODE)
            return res.status(201).json({
                id: 'mock-record-id',
                patient_id: patientId,
                professional_id: proId,
                content,
                type,
                created_at: new Date().toISOString()
            });
        }
    }
    try {
        const record = await prisma_1.default.record.create({
            data: {
                patient_id: patientId,
                professional_id: proId,
                content,
                type
            }
        });
        return res.status(201).json(record);
    }
    catch (e) {
        return res.status(500).json({ error: e.message || "Failed to create record" });
    }
};
exports.createNote = createNote;
const listNotes = async (req, res) => {
    const requestorId = req.user?.userId;
    const { patientId } = req.query; // If param is missing, assume list OWN records?
    const targetPatientId = patientId || requestorId;
    // 2. Permission Check (Mock ACL)
    // LGPD ABSOLUTE RULE: ADMIN CANNOT VIEW RECORDS
    const userRole = req.user?.role; // Assuming middleware populates this
    if (userRole === 'ADMIN') {
        console.warn(`🛑 [SECURITY] Admin ${requestorId} attempted to access PRONTUÁRIO. ACCESS DENIED.`);
        return res.status(403).json({ error: 'LGPD_VIOLATION: Admin cannot access sensitive health records.' });
    }
    await audit_service_1.AuditService.logAccess(requestorId, `patient:${targetPatientId}`, 'READ_RECORD', 'SUCCESS');
    if ((0, supabase_service_1.isMockMode)()) {
        try {
            // Try fetching from DB even in mock mode if available, else mock return
            const records = await prisma_1.default.record.findMany({
                where: { patient_id: targetPatientId },
                orderBy: { created_at: 'desc' }
            });
            if (records.length > 0)
                return res.json(records);
        }
        catch (e) { /* ignore in mock mode */ }
        return res.json([
            { id: 'rec-1', type: 'anamnesis', content: 'Patient reports anxiety. (Mock)', date: '2024-01-20' },
            { id: 'rec-2', type: 'session', content: 'Reiki session complete. (Mock)', date: '2024-01-25' }
        ]);
    }
    try {
        const records = await prisma_1.default.record.findMany({
            where: { patient_id: targetPatientId },
            orderBy: { created_at: 'desc' }
        });
        return res.json(records);
    }
    catch (e) {
        return res.status(500).json({ error: "Failed to fetch records" });
    }
};
exports.listNotes = listNotes;
const grantAccess = async (req, res) => {
    const patientId = req.user?.userId;
    const { professionalId } = req.body;
    await audit_service_1.AuditService.logAccess(patientId, `grant:${professionalId}`, 'GRANT_ACCESS', 'SUCCESS');
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json({ success: true, message: `Access granted to ${professionalId}` });
    }
    return res.json({ success: true });
};
exports.grantAccess = grantAccess;
const exportData = async (req, res) => {
    const userId = req.user?.userId;
    await audit_service_1.AuditService.logAccess(userId, 'all_data', 'EXPORT_DATA', 'SUCCESS');
    if ((0, supabase_service_1.isMockMode)()) {
        return res.json({
            user: { id: userId, name: 'Mock User' },
            records: [
                { id: 'rec-1', type: 'anamnesis', content: 'Patient reports anxiety.', date: '2024-01-20' },
                { id: 'rec-2', type: 'session', content: 'Reiki session complete.', date: '2024-01-25' }
            ],
            audit_logs: [
                { action: 'LOGIN', timestamp: new Date().toISOString() }
            ]
        });
    }
    return res.status(501).json({ error: 'Real export not implemented' });
};
exports.exportData = exportData;
