import crypto from 'crypto';
import { db } from '../config/db';
import { env } from '../config/env';
import { IAuditLog, IClientPersona, IFinancialPlan } from '../types/domain.types';
import { aiGateway } from './ai/aiGateway';
import { guardrailEngine } from './guardrails/guardrailEngine';
import { buildGoalPlans } from './quant/goalPlanner';
import { constructPortfolioAndBacktest } from './quant/portfolioBuilder';
import { evaluateRiskProfile } from './quant/riskEngine';

export function recordAuditLog(params: Omit<IAuditLog, 'id' | 'timestamp' | 'integrityHash'>): IAuditLog {
  const timestamp = new Date().toISOString();
  const id = `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const integrityHash = crypto
    .createHash('sha256')
    .update(`${id}|${timestamp}|${params.eventType}|${params.sebiRegNo}|${params.referenceId}|${params.summary}`)
    .digest('hex');

  const entry: IAuditLog = {
    id,
    timestamp,
    ...params,
    integrityHash,
  };
  db.auditLogs.unshift(entry);
  if (db.auditLogs.length > 500) {
    db.auditLogs.pop();
  }
  return entry;
}

export class PlanOrchestratorService {
  async generateFullPlan(persona: IClientPersona, useLiveAiNarrative = false): Promise<IFinancialPlan> {
    const startTime = Date.now();

    // 1. Deliverable 01: Separate Risk Capacity from Risk Tolerance & Resolve Conflicts
    const riskProfile = evaluateRiskProfile(persona);

    // 2. Deliverable 02: Inflation-Adjusted Goal Plans & Glide Path Schedules
    const goalPlans = buildGoalPlans(persona, riskProfile);

    // 3. Deliverable 03: AMFI Direct-Plan Shortlist & 10-Year Historical Backtest (2016-2025)
    const portfolioConstruction = constructPortfolioAndBacktest(persona, riskProfile, goalPlans);

    // 4. Deliverable 05: SEBI Suitability Guardrails & Conflict-of-Interest Disclosures
    const complianceGuardrails = guardrailEngine.evaluatePlanCompliance(
      persona,
      riskProfile,
      goalPlans,
      portfolioConstruction
    );

    // 5. Citations used across funds, inflation, and SEBI rules
    const citationsUsed = Array.from(
      new Set([
        ...portfolioConstruction.shortlistedFunds.map((f) => f.citationBadge),
        ...goalPlans.map((g) => g.inflationSourceCitation),
        '[SEBI (Investment Advisers) Regulations 2013, Reg 15, 16, 17 & 22, p. 12]',
      ])
    );

    // Deterministic grounded narrative builder (guarantees 100% numeric match & exact page citations)
    const buildDeterministicNarrative = () => {
      const execSummary = `For ${persona.name} (Age ${persona.age}, ${persona.city}), ArthaGuard separated objective Risk Capacity (${riskProfile.riskCapacityScore}/100, ${riskProfile.riskCapacityTier}) from behavioural Risk Tolerance (${riskProfile.riskToleranceScore}/100, ${riskProfile.riskToleranceTier}). Applying ${riskProfile.conflictResolutionRuleName}, the client’s Effective Risk Score is locked at ${riskProfile.effectiveRiskScore}/100 (${riskProfile.effectiveRiskTier}), capping equity at ${riskProfile.maxAllowedEquityPct}% [SEBI IA Reg 16 & 17, p. 12]. Total recommended Direct-Plan monthly SIP is ₹${portfolioConstruction.totalMonthlySipInr.toLocaleString('en-IN')}/month alongside ₹${portfolioConstruction.totalLumpSumDeploymentInr.toLocaleString('en-IN')} initial corpus deployment across ${portfolioConstruction.shortlistedFunds.length} AMFI Direct-Plan schemes (weighted TER ${portfolioConstruction.weightedExpenseRatioPct}%). Over the 10-year historical backtest (2016–2025), this portfolio delivered ${portfolioConstruction.tenYearBacktest.portfolioCagr10YrPct}% CAGR (vs ${portfolioConstruction.tenYearBacktest.benchmarkCagr10YrPct}% for ${portfolioConstruction.tenYearBacktest.benchmarkName}) with a ${portfolioConstruction.tenYearBacktest.maxDrawdownPct}% max drawdown.`;

      return execSummary;
    };

    let executiveSummary = buildDeterministicNarrative();

    if (useLiveAiNarrative) {
      const aiRes = await aiGateway.generate({
        taskType: 'PLAN_RATIONALE',
        systemPrompt:
          'You are ArthaGuard AI Co-Pilot for a SEBI-Registered Investment Adviser. Write a 3-sentence fiduciary executive summary using ONLY the exact numbers and citations provided. Never guarantee returns. Always include the exact page citations in brackets.',
        userPrompt: buildDeterministicNarrative(),
        temperature: 0.1,
        deterministicFallback: buildDeterministicNarrative,
      });
      executiveSummary = aiRes.content;
    }

    const planId = `plan-${persona.id}`;
    const planReferenceCode = `AG-${persona.personaCode}-2026`;

    const plan: IFinancialPlan = {
      id: planId,
      planReferenceCode,
      personaId: persona.id,
      personaSnapshot: persona,
      riskProfile,
      goalPlans,
      portfolioConstruction,
      complianceGuardrails,
      aiCoPilotMemo: {
        executiveSummary,
        riskConflictCommentary: riskProfile.conflictResolutionExplanation,
        goalStrategyCommentary: goalPlans.map((g) => `${g.goalName}: ${g.executionNotes}`).join(' | '),
        portfolioSelectionCommentary: `Shortlisted ${
          portfolioConstruction.shortlistedFunds.length
        } Direct-Plan schemes with weighted TER of ${
          portfolioConstruction.weightedExpenseRatioPct
        }% (0.00% distributor commission): ${portfolioConstruction.shortlistedFunds
          .map((f) => `${f.schemeName} (${f.weightPct}%, ${f.citationBadge})`)
          .join('; ')}.`,
        citationsUsed,
      },
      approvalWorkflow: {
        status: 'PENDING_ADVISER_REVIEW',
        clientExportUnlocked: false,
      },
      generationLatencyMs: Math.max(12, Date.now() - startTime),
      manualEquivalentMinutes: 270, // 4.5 hours manual RIA research & spreadsheet modeling
      createdAt: new Date().toISOString(),
    };

    db.plans.set(plan.id, plan);

    recordAuditLog({
      eventType: 'PLAN_GENERATED',
      actorName: env.DEFAULT_RIA_NAME,
      actorRole: 'RIA_ADVISER',
      sebiRegNo: env.DEFAULT_SEBI_REG_NO,
      referenceId: plan.planReferenceCode,
      summary: `Generated goal-based plan for ${persona.name} (ERS=${riskProfile.effectiveRiskScore}, SIP=₹${portfolioConstruction.totalMonthlySipInr.toLocaleString(
        'en-IN'
      )}, 10Y Backtest CAGR=${portfolioConstruction.tenYearBacktest.portfolioCagr10YrPct}%). Status: PENDING_ADVISER_REVIEW.`,
    });

    if (complianceGuardrails.suitabilityAlerts.some((a) => a.severity === 'CRITICAL_BLOCK')) {
      recordAuditLog({
        eventType: 'SUITABILITY_FLAG_RAISED',
        actorName: 'ArthaGuard Compliance Guardrail Engine',
        actorRole: 'COMPLIANCE_SYSTEM',
        sebiRegNo: env.DEFAULT_SEBI_REG_NO,
        referenceId: plan.planReferenceCode,
        summary: `Enforced SEBI Suitability Override on ${persona.name}: ${complianceGuardrails.suitabilityAlerts
          .map((a) => a.title)
          .join('; ')}`,
      });
    }

    return plan;
  }

  approveOrOverridePlan(params: {
    planId: string;
    adviserName: string;
    sebiRegNo: string;
    firmName: string;
    action: 'APPROVE' | 'OVERRIDE_AND_APPROVE' | 'REJECT';
    adviserNotes: string;
    overrideRationale?: string;
    customEquityPctOverride?: number;
  }): IFinancialPlan {
    const plan = db.plans.get(params.planId);
    if (!plan) {
      throw new Error(`Financial plan ${params.planId} not found.`);
    }

    const approvedAt = new Date().toISOString();
    const status =
      params.action === 'REJECT'
        ? 'REJECTED_BY_RIA'
        : params.action === 'OVERRIDE_AND_APPROVE'
        ? 'OVERRIDDEN_AND_APPROVED'
        : 'APPROVED_BY_RIA';

    const digitalSignatureHash = crypto
      .createHash('sha256')
      .update(
        `${plan.id}|${plan.personaId}|${params.sebiRegNo}|${plan.riskProfile.effectiveRiskScore}|${plan.portfolioConstruction.totalMonthlySipInr}|${status}|${approvedAt}`
      )
      .digest('hex');

    plan.approvalWorkflow = {
      status,
      clientExportUnlocked: status !== 'REJECTED_BY_RIA',
      reviewedByAdviserName: params.adviserName,
      reviewedBySebiRegNo: params.sebiRegNo,
      firmName: params.firmName,
      adviserNotes:
        params.adviserNotes ||
        'Reviewed risk capacity vs tolerance conflict resolution, RBI inflation-adjusted goal SIPs, AMFI Direct-Plan shortlist, and page-level SID citations. Approved for client release under SEBI IA Reg 15 & 17.',
      overrideRationale: params.overrideRationale,
      digitalSignatureHash,
      approvedAt,
    };

    db.plans.set(plan.id, plan);

    recordAuditLog({
      eventType: status === 'REJECTED_BY_RIA' ? 'RIA_PLAN_REJECTED' : 'RIA_PLAN_APPROVED',
      actorName: params.adviserName,
      actorRole: 'RIA_ADVISER',
      sebiRegNo: params.sebiRegNo,
      referenceId: plan.planReferenceCode,
      summary: `SEBI RIA (${params.sebiRegNo}) marked plan ${plan.planReferenceCode} as ${status}. Seal: ${digitalSignatureHash.slice(
        0,
        16
      )}...`,
    });

    return plan;
  }
}

export const planOrchestrator = new PlanOrchestratorService();
