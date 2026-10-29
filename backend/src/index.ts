import bcrypt from 'bcryptjs';
import { createApp } from './app';
import { db } from './config/db';
import { env } from './config/env';
import { cacheService } from './config/redis';
import { AMFI_DIRECT_FUNDS_SEED } from './data/amfiFunds.seed';
import { OFFICIAL_PERSONAS_SEED } from './data/personas.seed';
import { RAG_DOCUMENT_CHUNKS_SEED } from './data/ragDocuments.seed';
import { keepAliveService } from './services/keepAlive/keepAlive.service';
import { planOrchestrator } from './services/planOrchestrator.service';

export async function bootstrapDataAndServices(): Promise<void> {
  await db.initialize();
  await cacheService.initialize();

  // Seed default SEBI RIA User
  const passwordHash = await bcrypt.hash(env.DEFAULT_RIA_PASSWORD, 8);
  db.users.set('usr-ria-default', {
    id: 'usr-ria-default',
    email: env.DEFAULT_RIA_EMAIL,
    passwordHash,
    fullName: env.DEFAULT_RIA_NAME,
    role: 'RIA_ADVISER',
    sebiRegistrationNo: env.DEFAULT_SEBI_REG_NO,
    firmName: env.DEFAULT_RIA_FIRM,
    fiduciaryDeclarationAccepted: true,
    activeClientsCount: 1000,
    createdAt: new Date().toISOString(),
  });

  // Seed AMFI Direct-Plan Schemes
  for (const scheme of AMFI_DIRECT_FUNDS_SEED) {
    db.schemes.set(scheme.schemeCode, scheme);
  }

  // Seed RAG Document Chunks
  for (const chunk of RAG_DOCUMENT_CHUNKS_SEED) {
    db.ragChunks.set(chunk.chunkId, chunk);
  }

  // Seed all 6 Official Zeckathon PS 04 Personas & pre-compute their deterministic baseline plans
  for (const persona of OFFICIAL_PERSONAS_SEED) {
    db.personas.set(persona.id, persona);
    await planOrchestrator.generateFullPlan(persona, false);
  }

  console.log(
    `[Bootstrap] Seeded ${db.personas.size} personas, ${db.plans.size} verified plans, ${db.schemes.size} AMFI Direct-Plan funds, and ${db.ragChunks.size} page-indexed RAG chunks.`
  );
}

async function startServer() {
  await bootstrapDataAndServices();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`====================================================================`);
    console.log(`  ArthaGuard AI — SEBI RIA Co-Pilot Backend listening on port ${env.PORT}`);
    console.log(`  Health & Telemetry:  http://localhost:${env.PORT}/api/v1/health`);
    console.log(`  Keep-Alive Endpoint: http://localhost:${env.PORT}/api/v1/health/keep-alive`);
    console.log(`====================================================================`);
    keepAliveService.start();
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('[Fatal] Failed to start server:', err);
    process.exit(1);
  });
}
