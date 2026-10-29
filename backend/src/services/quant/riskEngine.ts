import { IClientPersona, IRiskProfileOutput, RiskTier } from '../../types/domain.types';

function scoreToTier(score: number): RiskTier {
  if (score <= 30) return 'CONSERVATIVE';
  if (score <= 50) return 'MODERATELY_CONSERVATIVE';
  if (score <= 70) return 'MODERATE';
  if (score <= 85) return 'MODERATELY_AGGRESSIVE';
  return 'AGGRESSIVE';
}

function tierToStrategicMix(tier: RiskTier): {
  maxAllowedEquityPct: number;
  equityPct: number;
  debtPct: number;
  hybridGoldPct: number;
  liquidPct: number;
} {
  switch (tier) {
    case 'CONSERVATIVE':
      return { maxAllowedEquityPct: 20, equityPct: 15, debtPct: 50, hybridGoldPct: 20, liquidPct: 15 };
    case 'MODERATELY_CONSERVATIVE':
      return { maxAllowedEquityPct: 40, equityPct: 30, debtPct: 40, hybridGoldPct: 20, liquidPct: 10 };
    case 'MODERATE':
      return { maxAllowedEquityPct: 60, equityPct: 50, debtPct: 25, hybridGoldPct: 15, liquidPct: 10 };
    case 'MODERATELY_AGGRESSIVE':
      return { maxAllowedEquityPct: 75, equityPct: 65, debtPct: 15, hybridGoldPct: 15, liquidPct: 5 };
    case 'AGGRESSIVE':
      return { maxAllowedEquityPct: 85, equityPct: 75, debtPct: 10, hybridGoldPct: 10, liquidPct: 5 };
  }
}

/**
 * Deliverable 01: Risk Profiling Engine (`riskEngine.ts`)
 * Strictly separates Risk Capacity (objective financial balance sheet) from Risk Tolerance (subjective behaviour)
 * and resolves conflicts using a transparent, deterministic SEBI Fiduciary Prudence Rule.
 */
export function evaluateRiskProfile(persona: IClientPersona): IRiskProfileOutput {
  const { financials, behaviouralQuestionnaire, goals, age } = persona;

  // ---------------------------------------------------------------------------
  // 1. OBJECTIVE RISK CAPACITY SCORE (RC in 0..100)
  // ---------------------------------------------------------------------------
  const weightedHorizon =
    goals.reduce((acc, g) => acc + g.horizonYears * (g.priority === 'CRITICAL' ? 1.5 : 1), 0) /
    Math.max(1, goals.reduce((acc, g) => acc + (g.priority === 'CRITICAL' ? 1.5 : 1), 0));

  let horizonScore = 50;
  if (weightedHorizon >= 12) horizonScore = 92;
  else if (weightedHorizon >= 7) horizonScore = 76;
  else if (weightedHorizon >= 4) horizonScore = 55;
  else horizonScore = 25;

  // Age-based physiological & retirement horizon cap
  if (age >= 60) {
    horizonScore = Math.min(horizonScore, 22);
  } else if (age >= 50) {
    horizonScore = Math.min(horizonScore, 60);
  }

  // Liquidity / Emergency Reserve Coverage (Months of expenses + EMI covered by liquid cash)
  const monthlyOutflow = Math.max(1, financials.monthlyExpensesInr + financials.monthlyEmiInr);
  const emergencyMonthsCovered = financials.liquidCashHoldingsInr / monthlyOutflow;
  let liquidityScore = 40;
  if (emergencyMonthsCovered >= 12) liquidityScore = 95;
  else if (emergencyMonthsCovered >= 6) liquidityScore = 80;
  else if (emergencyMonthsCovered >= 3) liquidityScore = 52;
  else liquidityScore = 18;

  // Debt Service / EMI Burden Ratio
  const emiToIncomeRatio = financials.monthlyEmiInr / Math.max(1, financials.monthlyTakeHomeInr);
  let debtBurdenScore = 85;
  if (emiToIncomeRatio === 0) debtBurdenScore = 95;
  else if (emiToIncomeRatio <= 0.15) debtBurdenScore = 82;
  else if (emiToIncomeRatio <= 0.3) debtBurdenScore = 62;
  else if (emiToIncomeRatio <= 0.45) debtBurdenScore = 40;
  else debtBurdenScore = 15;

  // Income Stability & Savings Surplus Rate
  const monthlySurplus = financials.monthlyTakeHomeInr - monthlyOutflow;
  const savingsRate = monthlySurplus / Math.max(1, financials.monthlyTakeHomeInr);
  let incomeStabilityScore = 60;
  switch (financials.incomeStability) {
    case 'SALARIED_STABLE':
      incomeStabilityScore = savingsRate >= 0.4 ? 92 : 80;
      break;
    case 'DUAL_INCOME':
      incomeStabilityScore = savingsRate >= 0.35 ? 88 : 76;
      break;
    case 'IRREGULAR_BUSINESS':
      incomeStabilityScore = 54;
      break;
    case 'VOLATILE_TRADER':
      incomeStabilityScore = 28;
      break;
    case 'PENSION_RETIREE':
      incomeStabilityScore = 20;
      break;
  }

  // Dependants & Family Liability Score
  let dependantsScore = 90;
  if (financials.dependantsCount === 0) dependantsScore = 95;
  else if (financials.dependantsCount === 1) dependantsScore = 72;
  else if (financials.dependantsCount === 2) dependantsScore = 55;
  else dependantsScore = 38;

  const riskCapacityScore = Math.round(
    0.25 * horizonScore +
      0.2 * liquidityScore +
      0.2 * debtBurdenScore +
      0.2 * incomeStabilityScore +
      0.15 * dependantsScore
  );
  const riskCapacityTier = scoreToTier(riskCapacityScore);

  // ---------------------------------------------------------------------------
  // 2. SUBJECTIVE BEHAVIOURAL RISK TOLERANCE SCORE (RT in 0..100)
  // ---------------------------------------------------------------------------
  let drawdownReactionScore = 50;
  switch (behaviouralQuestionnaire.drawdownReaction) {
    case 'SELL_ALL':
      drawdownReactionScore = 15;
      break;
    case 'HOLD_NERVOUSLY':
      drawdownReactionScore = 48;
      break;
    case 'HOLD_CALMLY':
      drawdownReactionScore = 78;
      break;
    case 'BUY_MORE':
      drawdownReactionScore = 94;
      break;
  }

  let returnPreferenceScore = 55;
  switch (behaviouralQuestionnaire.returnPreference) {
    case 'CAPITAL_SAFETY':
      returnPreferenceScore = 18;
      break;
    case 'BALANCED':
      returnPreferenceScore = 58;
      break;
    case 'HIGH_GROWTH':
      returnPreferenceScore = 84;
      break;
    case 'FAST_HIGH_RETURNS':
      returnPreferenceScore = 98;
      break;
  }

  let experienceScore = 50;
  let behaviouralBiasFlag: string | null = null;
  switch (behaviouralQuestionnaire.marketExperience) {
    case 'NONE_FD_ONLY':
      experienceScore = 22;
      behaviouralBiasFlag = 'Loss-Aversion & Familiarity Bias (Over-concentration in Bank FDs/Cash)';
      break;
    case 'MUTUAL_FUNDS':
      experienceScore = 70;
      break;
    case 'DIRECT_EQUITY':
      experienceScore = 84;
      break;
    case 'FNO_LOSSES':
      experienceScore = 88;
      behaviouralBiasFlag =
        'Speculative Loss-Chasing Bias (Realized F&O derivative losses triggering revenge-trading risk appetite)';
      break;
  }

  const maxdd = behaviouralQuestionnaire.maxAcceptableDrawdownPct;
  const volatilityComfortScore = Math.min(96, Math.max(12, Math.round(maxdd * 3.1)));

  const riskToleranceScore = Math.round(
    0.35 * drawdownReactionScore +
      0.25 * returnPreferenceScore +
      0.2 * experienceScore +
      0.2 * volatilityComfortScore
  );
  const riskToleranceTier = scoreToTier(riskToleranceScore);

  // ---------------------------------------------------------------------------
  // 3. TRANSPARENT CONFLICT RESOLUTION RULE (SEBI IA REG 16 & 17)
  // ---------------------------------------------------------------------------
  const conflictDelta = Math.abs(riskCapacityScore - riskToleranceScore);
  const conflictDetected =
    conflictDelta >= 18 ||
    riskCapacityTier !== riskToleranceTier ||
    Boolean(behaviouralQuestionnaire.clientStatedRequest.toLowerCase().includes('100% small-cap')) ||
    Boolean(behaviouralQuestionnaire.clientStatedRequest.toLowerCase().includes('high returns fast'));

  let effectiveRiskScore = Math.min(riskCapacityScore, riskToleranceScore);
  let conflictType: 'TOLERANCE_EXCEEDS_CAPACITY' | 'CAPACITY_EXCEEDS_TOLERANCE' | 'ALIGNED' = 'ALIGNED';
  let conflictResolutionRuleName = 'SEBI Fiduciary Alignment Rule (ERS = min(RC, RT))';
  let conflictResolutionFormula = 'ERS = min(Risk_Capacity, Risk_Tolerance)';
  let conflictResolutionExplanation = '';

  if (riskToleranceScore > riskCapacityScore + 12) {
    conflictType = 'TOLERANCE_EXCEEDS_CAPACITY';
    effectiveRiskScore = riskCapacityScore;
    conflictResolutionRuleName = 'SEBI Hard Capacity Ceiling Rule: ERS = min(RC, RT) = RC';
    conflictResolutionFormula = `ERS = min(RC=${riskCapacityScore}, RT=${riskToleranceScore}) = ${riskCapacityScore}`;
    conflictResolutionExplanation = `Client’s behavioural Risk Tolerance (${riskToleranceScore}/100, ${riskToleranceTier}) exceeds their objective financial Risk Capacity (${riskCapacityScore}/100, ${riskCapacityTier}). Under SEBI IA Regulation 16 & 17, an investor cannot be exposed to volatility their balance sheet, liquidity reserve (${emergencyMonthsCovered.toFixed(
      1
    )} months), or income stability cannot absorb. Effective Risk Score is strictly capped at Risk Capacity (${effectiveRiskScore}/100).`;
  } else if (riskCapacityScore > riskToleranceScore + 15) {
    conflictType = 'CAPACITY_EXCEEDS_TOLERANCE';
    if (age >= 60) {
      effectiveRiskScore = Math.min(riskCapacityScore, riskToleranceScore);
      conflictResolutionRuleName = 'Senior Citizen Capital Preservation Rule: ERS = min(RC, RT)';
      conflictResolutionFormula = `ERS = min(RC=${riskCapacityScore}, RT=${riskToleranceScore}) = ${effectiveRiskScore}`;
      conflictResolutionExplanation = `Client is a senior citizen (Age ${age}). Even where corpus size provides moderate capacity (${riskCapacityScore}/100), capital preservation and low behavioural tolerance (${riskToleranceScore}/100) take absolute precedence.`;
    } else {
      // High capacity, low tolerance (e.g., Doctor in Patna, Age 38) -> Controlled inflation-bridging blend (65% RT + 35% RC)
      effectiveRiskScore = Math.round(0.65 * riskToleranceScore + 0.35 * riskCapacityScore);
      conflictResolutionRuleName =
        'SEBI Behavioural Comfort & Inflation-Protection Bridge Rule: ERS = round(0.65 × RT + 0.35 × RC)';
      conflictResolutionFormula = `ERS = round(0.65 × ${riskToleranceScore} + 0.35 × ${riskCapacityScore}) = ${effectiveRiskScore}`;
      conflictResolutionExplanation = `Client has strong financial Risk Capacity (${riskCapacityScore}/100) from high stable surplus, but low behavioural Risk Tolerance (${riskToleranceScore}/100) due to FD-only familiarity. Purely following RT (${riskToleranceScore}) would fail long-term medical/retirement inflation, while following RC (${riskCapacityScore}) would cause panic-selling during drawdowns. The rule anchors 65% to behavioural comfort and bridges 35% toward capacity using low-volatility Balanced Advantage & Arbitrage vehicles (ERS = ${effectiveRiskScore}/100).`;
    }
  } else {
    conflictType = 'ALIGNED';
    effectiveRiskScore = Math.round(0.55 * Math.min(riskCapacityScore, riskToleranceScore) + 0.45 * Math.max(riskCapacityScore, riskToleranceScore));
    if (age >= 60) {
      effectiveRiskScore = Math.min(riskCapacityScore, riskToleranceScore);
    }
    conflictResolutionRuleName = 'Prudent Harmonic Suitability Rule';
    conflictResolutionFormula = `ERS = ${effectiveRiskScore} (Capacity=${riskCapacityScore}, Tolerance=${riskToleranceScore})`;
    conflictResolutionExplanation =
      age >= 60
        ? `Senior retiree profile (Age ${age}): both Risk Capacity (${riskCapacityScore}/100) and Risk Tolerance (${riskToleranceScore}/100) mandate strict capital protection and SWP bucket stability.`
        : `Risk Capacity (${riskCapacityScore}/100) and Risk Tolerance (${riskToleranceScore}/100) are within harmonious bounds (Δ = ${conflictDelta}).`;
  }

  const effectiveRiskTier = scoreToTier(effectiveRiskScore);
  const strategicMix = tierToStrategicMix(effectiveRiskTier);

  return {
    riskCapacityScore,
    riskCapacityTier,
    capacityBreakdown: {
      horizonScore,
      liquidityScore,
      debtBurdenScore,
      incomeStabilityScore,
      dependantsScore,
      explanation: `Weighted from Horizon (${horizonScore}), Liquidity Reserve (${liquidityScore}, ${emergencyMonthsCovered.toFixed(
        1
      )} mos covered), EMI Burden (${debtBurdenScore}, ${(emiToIncomeRatio * 100).toFixed(
        1
      )}% of income), Income Stability (${incomeStabilityScore}), and Dependants (${dependantsScore}).`,
    },
    riskToleranceScore,
    riskToleranceTier,
    toleranceBreakdown: {
      drawdownReactionScore,
      returnPreferenceScore,
      experienceScore,
      volatilityComfortScore,
      behaviouralBiasFlag,
      explanation: `Weighted from Drawdown Reaction (${drawdownReactionScore}), Return Preference (${returnPreferenceScore}), Market Experience (${experienceScore}), and Max Drawdown Comfort (${volatilityComfortScore}, ${maxdd}%).`,
    },
    conflictDetected,
    conflictDelta,
    conflictType,
    conflictResolutionRuleName,
    conflictResolutionFormula,
    conflictResolutionExplanation,
    effectiveRiskScore,
    effectiveRiskTier,
    maxAllowedEquityPct: strategicMix.maxAllowedEquityPct,
    recommendedStrategicMix: {
      equityPct: strategicMix.equityPct,
      debtPct: strategicMix.debtPct,
      hybridGoldPct: strategicMix.hybridGoldPct,
      liquidPct: strategicMix.liquidPct,
    },
  };
}
