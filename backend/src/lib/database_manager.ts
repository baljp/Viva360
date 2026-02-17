import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

// In a real scenario, this would be a distinct URL, e.g., a Read Replica endpoint
const READ_REPLICA_URL = process.env.READ_REPLICA_URL || SUPABASE_URL;

class DatabaseManager {
  private static instance: DatabaseManager;
  private writeClient: SupabaseClient;
  private readClient: SupabaseClient;

  private constructor() {
    logger.info('db_manager.initializing');
    
    // Primary (Write) Connection
    this.writeClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });

    // Replica (Read) Connection
    // In production, this points to a pool of read replicas
    this.readClient = createClient(READ_REPLICA_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });

    logger.info('db_manager.cqrs_ready', { write: 'master', read: 'replica_pool' });
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Use for INSERT, UPDATE, DELETE, RPC (Data mutation)
  public getWriter(): SupabaseClient {
    return this.writeClient;
  }

  // Use for SELECT only
  public getReader(): SupabaseClient {
    return this.readClient;
  }
}

export const dbManager = DatabaseManager.getInstance();
