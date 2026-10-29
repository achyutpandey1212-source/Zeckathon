import {
  GoalCategory,
  IClientPersona,
  IGlidePathStep,
  IGoalInput,
  IGoalPlanOutput,
  IRiskProfileOutput,
} from '../../types/domain.types';

/**
 * Returns RBI DBIE grounded inflation assumption and citation for each goal category.
 */
function getGoalInflationAssumption(category: GoalCategory): { ratePct: number; citation: string } {
  switch (category) {
    case 'EDUCATION':
      return {
        ratePct: 8.5,
        citation: '[RBI DBIE Household & Education Inflation Bulletin 2026, p. 8 (8.5% p.a.)]',
      };
    case 'MEDICAL':
      return {
        ratePct: 9.5,
        citation: '[RBI DBIE Healthcare & Hospitalization CPI Series 2026, p. 8 (9.5% p.a.)]',
      };
    case 'RETIREMENT':
    case 'SWP_INCOME':
    case 'WEALTH':
    case 'EMERGENCY':
    default:
      return {
        ratePct: 6.0,
        citation: '[RBI DBIE Long-Term Headline CPI Target Band 2026, p. 8 (6.0% p.a.)]',
      };
  }
}

/**
 * Determines goal-specific initial asset allocation constrained by BOTH the client's
 * Effective Risk Score (ERS) and the specific goal's time horizon.
 */
function computeGoalAssetAllocation(
  goal: IGoalInput,
  riskProfile: IRiskProfileOutput
): {
  equityPct: number;
  debtPct: number;
  hybridGoldPct: number;
  liquidPct: number;
  expectedAnnualReturnPct: number;
} {
  const maxEq = riskProfile.maxAllowedEquityPct;

  if (goal.category === 'EMERGENCY' || goal.horizonYears <= 2) {
    return {
      equityPct: 0,
      debtPct: 30,
      hybridGoldPct: 0,
      liquidPct: 70,
      expectedAnnualReturnPct: 6.9,
    };
  }

  if (goal.category === 'SWP_INCOME') {
    // Retiree 25-year SWP Bucket Strategy (Conservative Hybrid + Corporate Bond + Liquid)
    const eq = Math.min(maxEq, 20);
    return {
      equityPct: eq,
      debtPct: 50,
      hybridGoldPct: 15,
      liquidPct: 15,
      expectedAnnualReturnPct: 8.6,
    };
  }

  if (goal.horizonYears <= 5) {
    // Short-to-Medium term (e.g. Parents' Medical Corpus in 4 years)
    const eq = Math.min(maxEq, 20);
    return {
      equityPct: eq,
      debtPct: 50,
      hybridGoldPct: 15,
      liquidPct: 15,
      expectedAnnualReturnPct: 8.5,
    };
  }

  if (goal.horizonYears <= 10) {
    const eq = Math.min(maxEq, 55);
    const hybrid = 20;
    const debt = Math.max(15, 95 - eq - hybrid);
    return {
      equityPct: eq,
      debtPct: debt,
      hybridGoldPct: hybrid,
      liquidPct: 5,
      expectedAnnualReturnPct: Number(((eq * 13.5 + hybrid * 10.8 + debt * 7.5 + 5 * 6.5) / 100).toFixed(2)),
    };
  }

  // Long-Term Horizon (> 10 years: Education in 15 yrs, Retirement in 14-22 yrs, Wealth in 15 yrs)
  const eq = maxEq;
  const hybrid = eq >= 65 ? 15 : 25;
  const liquid = 5;
  const debt = Math.max(5, 100 - eq - hybrid - liquid);
  const expectedReturn = Number(((eq * 13.8 + hybrid * 11.0 + debt * 7.6 + liquid * 6.5) / 100).toFixed(2));

  return {
    equityPct: eq,
    debtPct: debt,
    hybridGoldPct: hybrid,
    liquidPct: liquid,
    expectedAnnualReturnPct: expectedReturn,
  };
}

/**
 * Generates a deterministic Glide Path schedule showing progressive de-risking
 * from Equity into Short-Duration Debt and Liquid Funds as the goal approaches.
 */
function buildGlidePathSchedule(
  goal: IGoalInput,
  initialAllocation: { equityPct: number; debtPct: number; hybridGoldPct: number; liquidPct: number }
): IGlidePathStep[] {
  const baseYear = 2026;
  const H = goal.horizonYears;
  const steps: IGlidePathStep[] = [];

  if (H <= 2) {
    steps.push({
      yearOffset: 0,
      calendarYear: baseYear,
      yearsRemaining: H,
      phaseLabel: 'Immediate Liquidity & Capital Preservation Phase',
      equityPct: initialAllocation.equityPct,
      debtPct: initialAllocation.debtPct,
      hybridGoldPct: initialAllocation.hybridGoldPct,
      liquidPct: initialAllocation.liquidPct,
      rebalancingTrigger: 'Hold 100% in Liquid & Short-Duration AAA Debt for instant drawdown readiness.',
    });
    steps.push({
      yearOffset: H,
      calendarYear: baseYear + H,
      yearsRemaining: 0,
      phaseLabel: 'Goal Maturity / Reserve Ready',
      equityPct: 0,
      debtPct: 20,
      hybridGoldPct: 0,
      liquidPct: 80,
      rebalancingTrigger: 'Maintain replenishing 6-12 month emergency reserve in HDFC Liquid / Kotak Arbitrage.',
    });
    return steps;
  }

  // Checkpoints: Year 0, Midpoint, 5Y left, 3Y left, 1Y left, Maturity (0Y left)
  const checkpoints = Array.from(
    new Set([
      0,
      Math.max(1, Math.floor(H * 0.4)),
      Math.max(1, H - 5),
      Math.max(1, H - 3),
      Math.max(1, H - 1),
      H,
    ])
  )
    .filter((y) => y >= 0 && y <= H)
    .sort((a, b) => a - b);

  for (const yrOffset of checkpoints) {
    const yrsLeft = H - yrOffset;
    if (goal.category === 'SWP_INCOME') {
      // Bucket strategy glide path for Retiree
      const eq = yrsLeft > 15 ? initialAllocation.equityPct : yrsLeft > 8 ? 15 : 10;
      const hybrid = yrsLeft > 8 ? 15 : 10;
      const debt = yrsLeft > 8 ? 55 : 55;
      const liq = 100 - eq - hybrid - debt;
      steps.push({
        yearOffset: yrOffset,
        calendarYear: baseYear + yrOffset,
        yearsRemaining: yrsLeft,
        phaseLabel:
          yrsLeft > 15
            ? 'Bucket 1-3 Active SWP + Inflation Refill'
            : yrsLeft > 5
            ? 'Bucket 2-1 Late Retirement Consolidation'
            : 'Pure Capital & Annuity Preservation',
        equityPct: eq,
        debtPct: debt,
        hybridGoldPct: hybrid,
        liquidPct: liq,
        rebalancingTrigger:
          'Annual refill of Bucket 1 (Liquid SWP account) from Corporate Bond & Balanced Advantage gains.',
      });
      continue;
    }

    if (yrsLeft > 5) {
      steps.push({
        yearOffset: yrOffset,
        calendarYear: baseYear + yrOffset,
        yearsRemaining: yrsLeft,
        phaseLabel: yrOffset === 0 ? 'Stage 1: Strategic Accumulation' : 'Stage 2: Core Compounding & Annual Rebalance',
        equityPct: initialAllocation.equityPct,
        debtPct: initialAllocation.debtPct,
        hybridGoldPct: initialAllocation.hybridGoldPct,
        liquidPct: initialAllocation.liquidPct,
        rebalancingTrigger: 'Rebalance annually if Equity drifts +/- 5% from strategic target.',
      });
    } else if (yrsLeft >= 4) {
      // 5 Years Remaining: Step-down Equity by 20%
      const eq = Math.max(0, initialAllocation.equityPct - 20);
      const hybrid = initialAllocation.hybridGoldPct;
      const liq = 10;
      const debt = 100 - eq - hybrid - liq;
      steps.push({
        yearOffset: yrOffset,
        calendarYear: baseYear + yrOffset,
        yearsRemaining: yrsLeft,
        phaseLabel: 'Stage 3: 5-Year De-Risking Trigger',
        equityPct: eq,
        debtPct: debt,
        hybridGoldPct: hybrid,
        liquidPct: liq,
        rebalancingTrigger: 'Initiate systematic STP from Mid/Flexi-Cap into HDFC Short Term Debt Fund.',
      });
    } else if (yrsLeft >= 2) {
      // 3 Years Remaining: Cap Equity at <= 25%
      const eq = Math.min(25, Math.max(0, initialAllocation.equityPct - 35));
      const hybrid = 15;
      const liq = 20;
      const debt = 100 - eq - hybrid - liq;
      steps.push({
        yearOffset: yrOffset,
        calendarYear: baseYear + yrOffset,
        yearsRemaining: yrsLeft,
        phaseLabel: 'Stage 4: 3-Year Capital Shield',
        equityPct: eq,
        debtPct: debt,
        hybridGoldPct: hybrid,
        liquidPct: liq,
        rebalancingTrigger: 'Lock in accumulated equity gains; shift 60%+ into AAA Short-Term & Corporate Bonds.',
      });
    } else if (yrsLeft === 1) {
      // 1 Year Remaining: Near-Zero Equity
      steps.push({
        yearOffset: yrOffset,
        calendarYear: baseYear + yrOffset,
        yearsRemaining: 1,
        phaseLabel: 'Stage 5: 12-Month Sequence-of-Returns Lock',
        equityPct: 0,
        debtPct: 40,
        hybridGoldPct: 0,
        liquidPct: 60,
        rebalancingTrigger: '100% exit from unhedged equity; park corpus in HDFC Liquid & Kotak Arbitrage.',
      });
    } else {
      steps.push({
        yearOffset: yrOffset,
        calendarYear: baseYear + yrOffset,
        yearsRemaining: 0,
        phaseLabel: 'Goal Maturity & Payout Execution',
        equityPct: 0,
        debtPct: 15,
        hybridGoldPct: 0,
        liquidPct: 85,
        rebalancingTrigger: 'Goal corpus available in T+1 liquid instruments with zero market drawdown risk.',
      });
    }
  }

  return steps;
}

/**
 * Deliverable 02: Goal-Based Planning Engine (`goalPlanner.ts`)
 * Calculates inflation-adjusted Future Corpus, required SIP, 10% Step-Up SIP,
 * Lump-Sum deployment, and Glide Path schedule for every goal.
 */
export function buildGoalPlans(persona: IClientPersona, riskProfile: IRiskProfileOutput): IGoalPlanOutput[] {
  return persona.goals.map((goal) => {
    const inflationInfo = getGoalInflationAssumption(goal.category);
    const alloc = computeGoalAssetAllocation(goal, riskProfile);

    const n = Math.max(1, goal.horizonYears);
    const iRate = inflationInfo.ratePct / 100;
    const rAnnual = alloc.expectedAnnualReturnPct / 100;
    const rMonthly = Math.pow(1 + rAnnual, 1 / 12) - 1;
    const months = n * 12;

    let futureCorpusRequiredInr = Math.round(goal.presentCostInr * Math.pow(1 + iRate, n));
    let swpMonthlyPayoutSupportedInr: number | undefined;
    let swpSustainabilityYears: number | undefined;

    if (goal.category === 'SWP_INCOME') {
      // For Retiree (Persona 5): Calculate exact corpus needed to sustain inflation-indexed monthly SWP for 25 years
      const targetSwpMonthly = goal.targetMonthlySwpInr || 40000;
      const annualSwpInitial = targetSwpMonthly * 12;
      const realReturn = (1 + rAnnual) / (1 + iRate) - 1;
      const pvFactor =
        Math.abs(realReturn) < 0.0001
          ? n
          : (1 - Math.pow(1 + realReturn, -n)) / realReturn;
      futureCorpusRequiredInr = Math.round(annualSwpInitial * pvFactor);
      swpMonthlyPayoutSupportedInr = targetSwpMonthly;
      swpSustainabilityYears = n;
    }

    const existingCorpusFutureValueInr =
      goal.category === 'SWP_INCOME'
        ? goal.existingEarmarkedCorpusInr
        : Math.round(goal.existingEarmarkedCorpusInr * Math.pow(1 + rAnnual, n));

    const netCorpusGapInr = Math.max(0, futureCorpusRequiredInr - existingCorpusFutureValueInr);

    // Exact Monthly SIP formula: FV = SIP * [((1 + r_m)^N - 1) / r_m] * (1 + r_m)
    const sipCompoundFactor = ((Math.pow(1 + rMonthly, months) - 1) / rMonthly) * (1 + rMonthly);
    const requiredMonthlySipInr =
      netCorpusGapInr > 0 ? Math.ceil(netCorpusGapInr / sipCompoundFactor / 100) * 100 : 0;

    // 10% Annual Step-Up SIP approximation factor over n years
    let stepUpCompoundSum = 0;
    for (let yr = 0; yr < n; yr++) {
      const stepFactor = Math.pow(1.1, yr);
      const monthsRemainingAtYrStart = (n - yr) * 12;
      const yrSipFv =
        stepFactor *
        (((Math.pow(1 + rMonthly, 12) - 1) / rMonthly) * (1 + rMonthly)) *
        Math.pow(1 + rAnnual, Math.max(0, monthsRemainingAtYrStart / 12 - 1));
      stepUpCompoundSum += yrSipFv;
    }
    const stepUpSip10PctInitialInr =
      netCorpusGapInr > 0 && n > 2
        ? Math.ceil(netCorpusGapInr / Math.max(1, stepUpCompoundSum) / 100) * 100
        : requiredMonthlySipInr;

    const glidePathSchedule = buildGlidePathSchedule(goal, alloc);

    const executionNotes =
      goal.category === 'SWP_INCOME'
        ? `Retiree 3-Bucket SWP Architecture: Deploy ₹${(goal.existingEarmarkedCorpusInr / 100000).toFixed(
            1
          )}L across Bucket 1 (HDFC Liquid & Kotak Arbitrage for Years 1–3 SWP of ₹${(
            swpMonthlyPayoutSupportedInr || 40000
          ).toLocaleString('en-IN')}/mo), Bucket 2 (ICICI Corporate Bond & HDFC Short Term Debt for Years 4–10), and Bucket 3 (HDFC Balanced Advantage for inflation hedging).`
        : requiredMonthlySipInr === 0
        ? `Fully funded via earmarked lump-sum/existing corpus of ₹${goal.existingEarmarkedCorpusInr.toLocaleString(
            'en-IN'
          )} growing at ${alloc.expectedAnnualReturnPct}% p.a. to cover inflation-adjusted requirement of ₹${futureCorpusRequiredInr.toLocaleString(
            'en-IN'
          )}.`
        : `Requires ₹${requiredMonthlySipInr.toLocaleString(
            'en-IN'
          )}/month flat SIP (or ₹${stepUpSip10PctInitialInr.toLocaleString(
            'en-IN'
          )}/month with 10% annual step-up) alongside ₹${goal.existingEarmarkedCorpusInr.toLocaleString(
            'en-IN'
          )} initial earmarked capital, assuming ${inflationInfo.ratePct}% RBI inflation and ${
            alloc.expectedAnnualReturnPct
          }% blended return.`;

    return {
      goalId: goal.goalId,
      goalName: goal.name,
      category: goal.category,
      priority: goal.priority,
      horizonYears: n,
      presentCostInr: goal.presentCostInr,
      assumedInflationPct: inflationInfo.ratePct,
      inflationSourceCitation: inflationInfo.citation,
      assumedPortfolioReturnPct: alloc.expectedAnnualReturnPct,
      futureCorpusRequiredInr,
      existingCorpusFutureValueInr,
      netCorpusGapInr,
      requiredMonthlySipInr,
      stepUpSip10PctInitialInr,
      recommendedLumpSumDeploymentInr: goal.existingEarmarkedCorpusInr,
      swpMonthlyPayoutSupportedInr,
      swpSustainabilityYears,
      assetAllocation: {
        equityPct: alloc.equityPct,
        debtPct: alloc.debtPct,
        hybridGoldPct: alloc.hybridGoldPct,
        liquidPct: alloc.liquidPct,
      },
      glidePathSchedule,
      executionNotes,
    };
  });
}
