import { Router } from 'express';
import { db } from '../config/db';
import { authenticateOrDemoRia } from '../middleware/auth.middleware';
import { planOrchestrator } from '../services/planOrchestrator.service';
import { IClientPersona } from '../types/domain.types';

export const personasRouter = Router();

personasRouter.get('/', authenticateOrDemoRia, (_req, res) => {
  const personas = Array.from(db.personas.values());
  res.json({
    count: personas.length,
    personas,
  });
});

personasRouter.get('/:id', authenticateOrDemoRia, (req, res) => {
  const persona = db.personas.get(req.params.id);
  if (!persona) {
    res.status(404).json({ error: `Persona ${req.params.id} not found.` });
    return;
  }
  res.json({ persona });
});

personasRouter.post('/', authenticateOrDemoRia, async (req, res) => {
  try {
    const body = req.body as Partial<IClientPersona>;
    const customIndex = db.personas.size + 1;
    const id = body.id || `persona-custom-${Date.now()}`;
    const personaCode = body.personaCode || `CUSTOM-P${customIndex}`;

    const newPersona: IClientPersona = {
      id,
      personaCode,
      name: body.name || 'Custom Client, India',
      age: Number(body.age) || 34,
      city: body.city || 'Mumbai',
      occupation: body.occupation || 'Professional',
      tagLine: body.tagLine || 'Custom Financial Plan & Suitability Profile',
      situationSummary: body.situationSummary || 'Custom investor profile entered by SEBI RIA.',
      goalTestSummary: body.goalTestSummary || 'Goal-based mutual fund plan with glide path and guardrails.',
      financials: {
        monthlyTakeHomeInr: Number(body.financials?.monthlyTakeHomeInr ?? 120000),
        monthlyExpensesInr: Number(body.financials?.monthlyExpensesInr ?? 50000),
        monthlyEmiInr: Number(body.financials?.monthlyEmiInr ?? 15000),
        liquidCashHoldingsInr: Number(body.financials?.liquidCashHoldingsInr ?? 300000),
        existingEquityInr: Number(body.financials?.existingEquityInr ?? 200000),
        existingDebtPensionInr: Number(body.financials?.existingDebtPensionInr ?? 100000),
        incomeStability: body.financials?.incomeStability || 'SALARIED_STABLE',
        dependantsCount: Number(body.financials?.dependantsCount ?? 1),
      },
      behaviouralQuestionnaire: {
        drawdownReaction: body.behaviouralQuestionnaire?.drawdownReaction || 'HOLD_CALMLY',
        returnPreference: body.behaviouralQuestionnaire?.returnPreference || 'BALANCED',
        marketExperience: body.behaviouralQuestionnaire?.marketExperience || 'MUTUAL_FUNDS',
        maxAcceptableDrawdownPct: Number(body.behaviouralQuestionnaire?.maxAcceptableDrawdownPct ?? 15),
        clientStatedRequest:
          body.behaviouralQuestionnaire?.clientStatedRequest ||
          'Create a balanced goal-based mutual fund plan with direct plans and inflation protection.',
      },
      goals:
        body.goals && body.goals.length > 0
          ? body.goals
          : [
              {
                goalId: `g-${Date.now()}-1`,
                name: 'Long-Term Retirement & Wealth Goal',
                category: 'RETIREMENT',
                presentCostInr: 8000000,
                horizonYears: 15,
                priority: 'CRITICAL',
                existingEarmarkedCorpusInr: 200000,
              },
            ],
      isOfficialSample: false,
      createdAt: new Date().toISOString(),
    };

    db.personas.set(newPersona.id, newPersona);
    const generatedPlan = await planOrchestrator.generateFullPlan(newPersona, false);

    res.status(201).json({
      persona: newPersona,
      plan: generatedPlan,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
