import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load both root .env and backend/.env, letting non-placeholder values win
const rootEnvPath = path.resolve(process.cwd(), '../.env');
const localEnvPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}
if (fs.existsSync(rootEnvPath)) {
  const parsedRoot = dotenv.parse(fs.readFileSync(rootEnvPath));
  for (const [key, val] of Object.entries(parsedRoot)) {
    const current = process.env[key] || '';
    const isCurrentPlaceholder =
      !current ||
      current.includes('<username>') ||
      current.includes('<password>') ||
      current.includes('your_') ||
      current.includes('cluster0.example');
    if (isCurrentPlaceholder && val) {
      process.env[key] = val;
    } else if (key === 'GEMINI_PRIMARY_MODEL' && val) {
      process.env[key] = val;
    }
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim()),

  // Render Keep-Alive Configuration
  ENABLE_KEEP_ALIVE: (process.env.ENABLE_KEEP_ALIVE || 'true').toLowerCase() === 'true',
  KEEP_ALIVE_INTERVAL_MS: parseInt(process.env.KEEP_ALIVE_INTERVAL_MS || '600000', 10), // 10 minutes
  RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || '5000'}`,
  KEEP_ALIVE_SECRET_TOKEN: process.env.KEEP_ALIVE_SECRET_TOKEN || 'ag_keepalive_secret_2026_zeckathon',

  // MongoDB Atlas (Document + Vector DB)
  MONGODB_URI: process.env.MONGODB_URI || '',
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'arthaguard_ria',
  MONGODB_VECTOR_INDEX_NAME: process.env.MONGODB_VECTOR_INDEX_NAME || 'vector_index_rag_chunks',

  // Redis / Upstash Cache
  REDIS_URL: process.env.REDIS_URL || '',
  CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10),

  // Single-Provider AI Layer (Gemini Primary + Groq Fallback)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_PRIMARY_MODEL: process.env.GEMINI_PRIMARY_MODEL || 'gemini-2.5-flash',
  GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',

  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_FALLBACK_MODEL: process.env.GROQ_FALLBACK_MODEL || 'llama-3.3-70b-versatile',

  AI_REQUEST_TIMEOUT_MS: parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '7500', 10),
  AI_CIRCUIT_BREAKER_COOLDOWN_MS: parseInt(process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS || '30000', 10),

  // Auth & SEBI RIA Defaults
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET || 'arthaguard_sebi_ria_jwt_access_secret_key_2026_zeckathon_ps04',
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || 'arthaguard_sebi_ria_jwt_refresh_secret_key_2026_zeckathon_ps04',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  DEFAULT_RIA_NAME: process.env.DEFAULT_RIA_NAME || 'Vikramaditya Rao, CFA (SEBI Registered Investment Adviser)',
  DEFAULT_RIA_EMAIL: process.env.DEFAULT_RIA_EMAIL || 'adviser@arthaguard.in',
  DEFAULT_RIA_PASSWORD: process.env.DEFAULT_RIA_PASSWORD || 'ArthaGuard@2026',
  DEFAULT_SEBI_REG_NO: process.env.DEFAULT_SEBI_REG_NO || 'INA000018492',
  DEFAULT_RIA_FIRM: process.env.DEFAULT_RIA_FIRM || 'ArthaGuard Fiduciary Advisory LLP',
};

export function isRealMongoConfigured(): boolean {
  const uri = env.MONGODB_URI;
  return Boolean(
    uri &&
      uri.startsWith('mongodb') &&
      !uri.includes('<username>') &&
      !uri.includes('<password>') &&
      !uri.includes('cluster0.example.mongodb.net')
  );
}

export function isRealRedisConfigured(): boolean {
  const url = env.REDIS_URL;
  return Boolean(
    url &&
      (url.startsWith('redis://') || url.startsWith('rediss://')) &&
      !url.includes('<password>') &&
      !url.includes('<endpoint>')
  );
}

export function isRealGeminiConfigured(): boolean {
  const key = env.GEMINI_API_KEY;
  return Boolean(key && key.length > 15 && !key.includes('your_gemini_api_key'));
}

export function isRealGroqConfigured(): boolean {
  const key = env.GROQ_API_KEY;
  return Boolean(key && key.length > 15 && !key.includes('your_groq_api_key'));
}
