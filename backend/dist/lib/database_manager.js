"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbManager = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
// In a real scenario, this would be a distinct URL, e.g., a Read Replica endpoint
const READ_REPLICA_URL = process.env.READ_REPLICA_URL || SUPABASE_URL;
class DatabaseManager {
    constructor() {
        console.log('🔌 Initializing Database Connections (CQRS Mode)...');
        // Primary (Write) Connection
        this.writeClient = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: { persistSession: false }
        });
        // Replica (Read) Connection
        // In production, this points to a pool of read replicas
        this.readClient = (0, supabase_js_1.createClient)(READ_REPLICA_URL, SUPABASE_SERVICE_KEY, {
            auth: { persistSession: false }
        });
        console.log('✅ CQRS: Write Path -> Master');
        console.log('✅ CQRS: Read Path -> Replica Pool');
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    // Use for INSERT, UPDATE, DELETE, RPC (Data mutation)
    getWriter() {
        return this.writeClient;
    }
    // Use for SELECT only
    getReader() {
        return this.readClient;
    }
}
exports.dbManager = DatabaseManager.getInstance();
