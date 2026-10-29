import { Router } from 'express';
import { db } from '../config/db';
import { cacheService } from '../config/redis';
import { aiGateway } from '../services/ai/aiGateway';
import { keepAliveService } from '../services/keepAlive/keepAlive.service';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  keepAliveService.recordInboundHeartbeat();
  res.json({
    status: 'OK',
    service: 'ArthaGuard AI — SEBI RIA Co-Pilot Backend (Zeckathon PS 04)',
    timestamp: new Date().toISOString(),
    database: db.getStatus(),
    cache: cacheService.getStats(),
    aiGateway: aiGateway.getGatewayTelemetry(),
    keepAlive: keepAliveService.getTelemetry(),
  });
});

healthRouter.get('/keep-alive', (_req, res) => {
  keepAliveService.recordInboundHeartbeat();
  res.json({
    status: 'AWAKE',
    message: 'Render 15-minute cooldown timer reset successfully.',
    keepAlive: keepAliveService.getTelemetry(),
  });
});

healthRouter.get('/ping', (_req, res) => {
  keepAliveService.recordInboundHeartbeat();
  res.status(200).send('PONG');
});
