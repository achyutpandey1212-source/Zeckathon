import mongoose from 'mongoose';
import { env, isRealMongoConfigured } from './env';
import {
  IAuditLog,
  IClientPersona,
  IFinancialPlan,
  IFundScheme,
  IRagChunk,
  IUser,
} from '../types/domain.types';

/**
 * DualModeDatabase manages MongoDB Atlas (Document + Vector Search) when MONGODB_URI
 * is configured, and seamlessly mirrors/falls back to an in-memory + deterministic
 * store so that the repository works out-of-the-box with zero external dependencies.
 */
class DualModeDatabase {
  private mongoConnected = false;
  private mode: 'MONGODB_ATLAS' | 'LOCAL_MEMORY_MIRROR' = 'LOCAL_MEMORY_MIRROR';

  public users: Map<string, IUser> = new Map();
  public personas: Map<string, IClientPersona> = new Map();
  public plans: Map<string, IFinancialPlan> = new Map();
  public schemes: Map<string, IFundScheme> = new Map();
  public ragChunks: Map<string, IRagChunk> = new Map();
  public auditLogs: IAuditLog[] = [];

  async initialize(): Promise<void> {
    if (isRealMongoConfigured()) {
      try {
        await mongoose.connect(env.MONGODB_URI, {
          dbName: env.MONGODB_DB_NAME,
          serverSelectionTimeoutMS: 5000,
        });
        this.mongoConnected = true;
        this.mode = 'MONGODB_ATLAS';
        console.log(`[Database] Connected to MongoDB Atlas (${env.MONGODB_DB_NAME})`);
      } catch (err) {
        console.warn(
          '[Database] MongoDB Atlas connection unavailable, running in high-speed Local Persistence + In-Memory Vector mode:',
          (err as Error).message
        );
        this.mongoConnected = false;
        this.mode = 'LOCAL_MEMORY_MIRROR';
      }
    } else {
      console.log(
        '[Database] Placeholder MONGODB_URI detected -> Running in Local Persistence + In-Memory Vector mode (enrich .env to switch to MongoDB Atlas).'
      );
      this.mode = 'LOCAL_MEMORY_MIRROR';
    }
  }

  getStatus() {
    return {
      mode: this.mode,
      mongoConnected: this.mongoConnected,
      vectorIndexName: env.MONGODB_VECTOR_INDEX_NAME,
      counts: {
        users: this.users.size,
        personas: this.personas.size,
        plans: this.plans.size,
        amfiSchemes: this.schemes.size,
        ragChunks: this.ragChunks.size,
        auditLogs: this.auditLogs.length,
      },
    };
  }
}

export const db = new DualModeDatabase();
