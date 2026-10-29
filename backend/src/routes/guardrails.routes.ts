import { Router } from 'express';
import { TEN_ADVERSARIAL_PROMPTS_SEED } from '../data/adversarialPrompts.seed';
import { env } from '../config/env';
import { authenticateOrDemoRia } from '../middleware/auth.middleware';
import { guardrailEngine } from '../services/guardrails/guardrailEngine';
import { recordAuditLog } from '../services/planOrchestrator.service';

export const guardrailsRouter = Router();

guardrailsRouter.get('/adversarial-prompts', authenticateOrDemoRia, (_req, res) => {
  res.json({
    count: TEN_ADVERSARIAL_PROMPTS_SEED.length,
    prompts: TEN_ADVERSARIAL_PROMPTS_SEED,
  });
});

guardrailsRouter.post('/validate', authenticateOrDemoRia, (req, res) => {
  const { prompt } = req.body as { prompt?: string };
  if (!prompt || !prompt.trim()) {
    res.status(400).json({ error: 'prompt is required.' });
    return;
  }

  const validation = guardrailEngine.validatePrompt(prompt.trim());

  if (!validation.allowed) {
    recordAuditLog({
      eventType: 'ADVERSARIAL_PROMPT_BLOCKED',
      actorName: req.user?.fullName || env.DEFAULT_RIA_NAME,
      actorRole: req.user?.role || 'RIA_ADVISER',
      sebiRegNo: req.user?.sebiRegistrationNo || env.DEFAULT_SEBI_REG_NO,
      referenceId: validation.violationCategory || 'SEBI-GUARDRAIL',
      summary: `Blocked adversarial prompt: "${prompt.slice(0, 75)}" under ${validation.sebiRegulationCited}`,
    });
  }

  res.json(validation);
});

guardrailsRouter.post('/adversarial-suite', authenticateOrDemoRia, (_req, res) => {
  const suiteResult = guardrailEngine.run10AdversarialSuite();
  res.json(suiteResult);
});
