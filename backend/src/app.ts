import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { auditRouter } from './routes/audit.routes';
import { authRouter } from './routes/auth.routes';
import { fundsRouter } from './routes/funds.routes';
import { guardrailsRouter } from './routes/guardrails.routes';
import { healthRouter } from './routes/health.routes';
import { personasRouter } from './routes/personas.routes';
import { plansRouter } from './routes/plans.routes';
import { ragRouter } from './routes/rag.routes';

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-keep-alive-token'],
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '2mb' }));

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/v1', apiLimiter);

  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/personas', personasRouter);
  app.use('/api/v1/plans', plansRouter);
  app.use('/api/v1/funds', fundsRouter);
  app.use('/api/v1/rag', ragRouter);
  app.use('/api/v1/guardrails', guardrailsRouter);
  app.use('/api/v1/audit', auditRouter);

  // Also mount root aliases in case VITE_API_BASE_URL is configured without `/api/v1`
  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/personas', personasRouter);
  app.use('/plans', plansRouter);
  app.use('/funds', fundsRouter);
  app.use('/rag', ragRouter);
  app.use('/guardrails', guardrailsRouter);
  app.use('/audit', auditRouter);

  app.get('/', (_req, res) => {
    res.json({
      name: 'ArthaGuard AI — SEBI-Registered Investment Adviser Co-Pilot API',
      track: 'Zeckathon PS 04 (AI Advisory • Suitability • Human-in-the-Loop)',
      healthEndpoint: '/api/v1/health',
      keepAliveEndpoint: '/api/v1/health/keep-alive',
      reproducibilityEndpoint: '/api/v1/audit/reproducibility-report',
    });
  });

  return app;
}
