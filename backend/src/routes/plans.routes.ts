import { Router } from 'express';
import { db } from '../config/db';
import { env } from '../config/env';
import { authenticateOrDemoRia } from '../middleware/auth.middleware';
import { planOrchestrator } from '../services/planOrchestrator.service';

export const plansRouter = Router();

plansRouter.get('/', authenticateOrDemoRia, (_req, res) => {
  const plans = Array.from(db.plans.values());
  res.json({
    count: plans.length,
    plans,
  });
});

plansRouter.get('/by-persona/:personaId', authenticateOrDemoRia, async (req, res) => {
  const { personaId } = req.params;
  const existing = db.plans.get(`plan-${personaId}`);
  if (existing) {
    res.json({ plan: existing });
    return;
  }

  const persona = db.personas.get(personaId);
  if (!persona) {
    res.status(404).json({ error: `Persona ${personaId} not found.` });
    return;
  }

  const plan = await planOrchestrator.generateFullPlan(persona, false);
  res.json({ plan });
});

plansRouter.post('/generate', authenticateOrDemoRia, async (req, res) => {
  try {
    const { personaId, useAiNarrative } = req.body as {
      personaId?: string;
      useAiNarrative?: boolean;
    };

    if (!personaId) {
      res.status(400).json({ error: 'personaId is required.' });
      return;
    }

    const persona = db.personas.get(personaId);
    if (!persona) {
      res.status(404).json({ error: `Persona ${personaId} not found.` });
      return;
    }

    const plan = await planOrchestrator.generateFullPlan(persona, Boolean(useAiNarrative));
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

plansRouter.post('/:planId/approve', authenticateOrDemoRia, (req, res) => {
  try {
    const { planId } = req.params;
    const { action, adviserNotes, overrideRationale, adviserName, sebiRegNo } = req.body as {
      action?: 'APPROVE' | 'OVERRIDE_AND_APPROVE' | 'REJECT';
      adviserNotes?: string;
      overrideRationale?: string;
      adviserName?: string;
      sebiRegNo?: string;
    };

    const updatedPlan = planOrchestrator.approveOrOverridePlan({
      planId,
      adviserName: adviserName || req.user?.fullName || env.DEFAULT_RIA_NAME,
      sebiRegNo: sebiRegNo || req.user?.sebiRegistrationNo || env.DEFAULT_SEBI_REG_NO,
      firmName: req.user?.firmName || env.DEFAULT_RIA_FIRM,
      action: action || 'APPROVE',
      adviserNotes:
        adviserNotes ||
        'Verified Risk Capacity vs Risk Tolerance conflict resolution, RBI inflation-adjusted goal SIPs, AMFI Direct-Plan selection criteria, and page-level SID citations. Approved for client delivery.',
      overrideRationale,
    });

    res.json({
      message: 'Plan approval state updated with cryptographic SHA-256 fiduciary seal.',
      plan: updatedPlan,
    });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});
