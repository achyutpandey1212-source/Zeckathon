import { Router } from 'express';
import { db } from '../config/db';
import { authenticateOrDemoRia } from '../middleware/auth.middleware';
import { guardrailEngine } from '../services/guardrails/guardrailEngine';
import { ragEngine } from '../services/rag/ragEngine';

export const auditRouter = Router();

auditRouter.get('/logs', authenticateOrDemoRia, (_req, res) => {
  res.json({
    count: db.auditLogs.length,
    logs: db.auditLogs,
  });
});

auditRouter.get('/reproducibility-report', async (_req, res) => {
  const plans = Array.from(db.plans.values());
  const rag25 = await ragEngine.run25QuestionBenchmark();
  const adv10 = guardrailEngine.run10AdversarialSuite();

  res.json({
    generatedAt: new Date().toISOString(),
    reproducibilityGuarantee:
      'Every number in this report and in SUBMISSION_REPORT.md is deterministically reproduced by the quantitative engines in backend/src/services/quant/.',
    personaSummaries: plans.map((p) => ({
      personaCode: p.personaSnapshot.personaCode,
      name: p.personaSnapshot.name,
      age: p.personaSnapshot.age,
      city: p.personaSnapshot.city,
      riskCapacityScore: p.riskProfile.riskCapacityScore,
      riskToleranceScore: p.riskProfile.riskToleranceScore,
      conflictDetected: p.riskProfile.conflictDetected,
      conflictRule: p.riskProfile.conflictResolutionRuleName,
      effectiveRiskScore: p.riskProfile.effectiveRiskScore,
      effectiveRiskTier: p.riskProfile.effectiveRiskTier,
      maxAllowedEquityPct: p.riskProfile.maxAllowedEquityPct,
      blendedAllocation: p.portfolioConstruction.blendedAllocation,
      totalMonthlySipInr: p.portfolioConstruction.totalMonthlySipInr,
      totalLumpSumDeploymentInr: p.portfolioConstruction.totalLumpSumDeploymentInr,
      weightedExpenseRatioPct: p.portfolioConstruction.weightedExpenseRatioPct,
      backtest10YrCagrPct: p.portfolioConstruction.tenYearBacktest.portfolioCagr10YrPct,
      benchmark10YrCagrPct: p.portfolioConstruction.tenYearBacktest.benchmarkCagr10YrPct,
      alphaGeneratedPct: p.portfolioConstruction.tenYearBacktest.alphaGeneratedPct,
      maxDrawdownPct: p.portfolioConstruction.tenYearBacktest.maxDrawdownPct,
      sharpeRatio: p.portfolioConstruction.tenYearBacktest.sharpeRatio,
      goals: p.goalPlans.map((g) => ({
        goalName: g.goalName,
        horizonYears: g.horizonYears,
        presentCostInr: g.presentCostInr,
        assumedInflationPct: g.assumedInflationPct,
        futureCorpusRequiredInr: g.futureCorpusRequiredInr,
        requiredMonthlySipInr: g.requiredMonthlySipInr,
        stepUpSip10PctInitialInr: g.stepUpSip10PctInitialInr,
      })),
    })),
    rag25BenchmarkSummary: {
      totalQuestions: rag25.totalQuestions,
      passedCount: rag25.passedCount,
      accuracyScorePct: rag25.accuracyScorePct,
      uncitedOrHallucinatedCount: rag25.uncitedOrHallucinatedCount,
    },
    adversarial10SuiteSummary: {
      totalPrompts: adv10.totalPrompts,
      blockedCount: adv10.blockedCount,
      robustnessScorePct: adv10.robustnessScorePct,
    },
  });
});
