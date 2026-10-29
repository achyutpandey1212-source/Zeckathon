export type UserRole = 'RIA_ADVISER' | 'COMPLIANCE_OFFICER' | 'CLIENT_VIEWER' | 'DEMO_JUDGE';

export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  sebiRegistrationNo: string;
  firmName: string;
  fiduciaryDeclarationAccepted: boolean;
  activeClientsCount: number;
  createdAt: string;
}

export type GoalCategory = 'EMERGENCY' | 'EDUCATION' | 'RETIREMENT' | 'MEDICAL' | 'WEALTH' | 'SWP_INCOME';

export interface IGoalInput {
  goalId: string;
  name: string;
  category: GoalCategory;
  presentCostInr: number;
  horizonYears: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  existingEarmarkedCorpusInr: number;
  targetMonthlySwpInr?: number;
}

export interface IClientPersona {
  id: string;
  personaCode: string;
  name: string;
  age: number;
  city: string;
  occupation: string;
  tagLine: string;
  situationSummary: string;
  goalTestSummary: string;
  financials: {
    monthlyTakeHomeInr: number;
    monthlyExpensesInr: number;
    monthlyEmiInr: number;
    liquidCashHoldingsInr: number;
    existingEquityInr: number;
    existingDebtPensionInr: number;
    monthlyPensionInr?: number;
    fnoCumulativeLossesInr?: number;
    incomeStability: 'SALARIED_STABLE' | 'DUAL_INCOME' | 'IRREGULAR_BUSINESS' | 'PENSION_RETIREE' | 'VOLATILE_TRADER';
    dependantsCount: number;
  };
  behaviouralQuestionnaire: {
    drawdownReaction: 'SELL_ALL' | 'HOLD_NERVOUSLY' | 'HOLD_CALMLY' | 'BUY_MORE';
    returnPreference: 'CAPITAL_SAFETY' | 'BALANCED' | 'HIGH_GROWTH' | 'FAST_HIGH_RETURNS';
    marketExperience: 'NONE_FD_ONLY' | 'MUTUAL_FUNDS' | 'DIRECT_EQUITY' | 'FNO_LOSSES';
    maxAcceptableDrawdownPct: number;
    clientStatedRequest: string;
  };
  goals: IGoalInput[];
  isOfficialSample: boolean;
  createdAt: string;
}

export type RiskTier =
  | 'CONSERVATIVE'
  | 'MODERATELY_CONSERVATIVE'
  | 'MODERATE'
  | 'MODERATELY_AGGRESSIVE'
  | 'AGGRESSIVE';

export interface IRiskProfileOutput {
  riskCapacityScore: number;
  riskCapacityTier: RiskTier;
  capacityBreakdown: {
    horizonScore: number;
    liquidityScore: number;
    debtBurdenScore: number;
    incomeStabilityScore: number;
    dependantsScore: number;
    explanation: string;
  };
  riskToleranceScore: number;
  riskToleranceTier: RiskTier;
  toleranceBreakdown: {
    drawdownReactionScore: number;
    returnPreferenceScore: number;
    experienceScore: number;
    volatilityComfortScore: number;
    behaviouralBiasFlag: string | null;
    explanation: string;
  };
  conflictDetected: boolean;
  conflictDelta: number;
  conflictType: 'TOLERANCE_EXCEEDS_CAPACITY' | 'CAPACITY_EXCEEDS_TOLERANCE' | 'ALIGNED';
  conflictResolutionRuleName: string;
  conflictResolutionFormula: string;
  conflictResolutionExplanation: string;
  effectiveRiskScore: number;
  effectiveRiskTier: RiskTier;
  maxAllowedEquityPct: number;
  recommendedStrategicMix: {
    equityPct: number;
    debtPct: number;
    hybridGoldPct: number;
    liquidPct: number;
  };
}

export interface IGlidePathStep {
  yearOffset: number;
  calendarYear: number;
  yearsRemaining: number;
  phaseLabel: string;
  equityPct: number;
  debtPct: number;
  hybridGoldPct: number;
  liquidPct: number;
  rebalancingTrigger: string;
}

export interface IGoalPlanOutput {
  goalId: string;
  goalName: string;
  category: GoalCategory;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  horizonYears: number;
  presentCostInr: number;
  assumedInflationPct: number;
  inflationSourceCitation: string;
  assumedPortfolioReturnPct: number;
  futureCorpusRequiredInr: number;
  existingCorpusFutureValueInr: number;
  netCorpusGapInr: number;
  requiredMonthlySipInr: number;
  stepUpSip10PctInitialInr: number;
  recommendedLumpSumDeploymentInr: number;
  swpMonthlyPayoutSupportedInr?: number;
  swpSustainabilityYears?: number;
  assetAllocation: {
    equityPct: number;
    debtPct: number;
    hybridGoldPct: number;
    liquidPct: number;
  };
  glidePathSchedule: IGlidePathStep[];
  executionNotes: string;
}

export interface IFundScheme {
  schemeCode: string;
  isin: string;
  schemeName: string;
  amcName: string;
  planType: 'Direct Plan - Growth';
  sebiCategory: string;
  assetClass: 'EQUITY' | 'DEBT' | 'HYBRID' | 'LIQUID';
  riskometer: 'Low' | 'Low to Moderate' | 'Moderate' | 'Moderately High' | 'High' | 'Very High';
  benchmarkName: string;
  expenseRatioPct: number;
  exitLoadSummary: string;
  aumCr: number;
  managerName: string;
  managerTenureYears: number;
  trackingErrorPct: number | null;
  rollingReturn1YrPct: number;
  rollingReturn3YrCagrPct: number;
  rollingReturn5YrCagrPct: number;
  cagr10YrPct: number;
  maxDrawdownPct: number;
  annualizedVolatilityPct: number;
  sharpeRatio: number;
  sortinoRatio: number;
  minSipInr: number;
  minLumpSumInr: number;
  yearlyReturns2016To2025: Record<number, number>; // e.g. { 2016: 11.4, ..., 2025: 16.8 }
  topHoldingsSummary: string;
  sourceCitation: string;
  sourceDocId: string;
  sourcePageNumber: number;
}

export interface IShortlistedFundAllocation {
  schemeCode: string;
  isin: string;
  schemeName: string;
  amcName: string;
  sebiCategory: string;
  assetClass: 'EQUITY' | 'DEBT' | 'HYBRID' | 'LIQUID';
  riskometer: string;
  weightPct: number;
  monthlySipAllocationInr: number;
  lumpSumAllocationInr: number;
  expenseRatioPct: number;
  aumCr: number;
  managerName: string;
  managerTenureYears: number;
  trackingErrorPct: number | null;
  rollingReturn3YrCagrPct: number;
  rollingReturn5YrCagrPct: number;
  cagr10YrPct: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  selectionScore: number;
  selectionCriteriaSummary: string;
  citationBadge: string;
  sourceDocId: string;
  sourcePageNumber: number;
}

export interface IBacktestYearPoint {
  year: number;
  portfolioReturnPct: number;
  benchmarkReturnPct: number;
  portfolioValueInr: number;
  benchmarkValueInr: number;
  portfolioDrawdownPct: number;
  benchmarkDrawdownPct: number;
  marketRegimeNote: string;
}

export interface IPortfolioConstructionOutput {
  blendedAllocation: {
    equityPct: number;
    debtPct: number;
    hybridGoldPct: number;
    liquidPct: number;
  };
  totalMonthlySipInr: number;
  totalLumpSumDeploymentInr: number;
  monthlySurplusAvailableInr: number;
  surplusUtilizationPct: number;
  weightedExpenseRatioPct: number;
  screeningCriteriaStated: {
    planFilter: string;
    minAumCr: number;
    minManagerTenureYears: number;
    maxExpenseRatioEquityPct: number;
    maxExpenseRatioDebtPct: number;
    weightsUsed: string;
  };
  shortlistedFunds: IShortlistedFundAllocation[];
  tenYearBacktest: {
    startYear: number;
    endYear: number;
    initialInvestmentInr: number;
    benchmarkName: string;
    portfolioFinalValueInr: number;
    benchmarkFinalValueInr: number;
    portfolioCagr10YrPct: number;
    benchmarkCagr10YrPct: number;
    alphaGeneratedPct: number;
    maxDrawdownPct: number;
    benchmarkMaxDrawdownPct: number;
    annualizedVolatilityPct: number;
    sharpeRatio: number;
    sortinoRatio: number;
    rolling3YrMinPct: number;
    rolling3YrMedianPct: number;
    rolling3YrMaxPct: number;
    yearlySeries: IBacktestYearPoint[];
  };
}

export interface ISuitabilityAlert {
  code: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL_BLOCK';
  title: string;
  clientRequestTriggered: string;
  whyUnsuitable: string;
  sebiRegulationRef: string;
  coPilotOverrideAction: string;
}

export interface IComplianceGuardrailsOutput {
  passedAllHardRules: boolean;
  noReturnGuaranteeVerified: boolean;
  directPlanOnlyVerified: boolean;
  fiduciaryConflictOfInterestDisclosure: string;
  sebiRegulatoryDisclosures: string[];
  suitabilityAlerts: ISuitabilityAlert[];
}

export interface IApprovalWorkflow {
  status: 'PENDING_ADVISER_REVIEW' | 'APPROVED_BY_RIA' | 'OVERRIDDEN_AND_APPROVED' | 'REJECTED_BY_RIA';
  clientExportUnlocked: boolean;
  reviewedByAdviserName?: string;
  reviewedBySebiRegNo?: string;
  firmName?: string;
  adviserNotes?: string;
  overrideRationale?: string;
  digitalSignatureHash?: string;
  approvedAt?: string;
}

export interface IFinancialPlan {
  id: string;
  planReferenceCode: string;
  personaId: string;
  personaSnapshot: IClientPersona;
  riskProfile: IRiskProfileOutput;
  goalPlans: IGoalPlanOutput[];
  portfolioConstruction: IPortfolioConstructionOutput;
  complianceGuardrails: IComplianceGuardrailsOutput;
  aiCoPilotMemo: {
    executiveSummary: string;
    riskConflictCommentary: string;
    goalStrategyCommentary: string;
    portfolioSelectionCommentary: string;
    citationsUsed: string[];
  };
  approvalWorkflow: IApprovalWorkflow;
  generationLatencyMs: number;
  manualEquivalentMinutes: number;
  createdAt: string;
}

export interface IRagChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentType: 'FACTSHEET' | 'SID' | 'PORTFOLIO_DISCLOSURE' | 'SEBI_REGULATION' | 'RBI_DBIE_MACRO';
  schemeCode?: string;
  amcName?: string;
  asOfDate: string;
  pageNumber: number;
  sectionHeading: string;
  content: string;
  structuredFacts: Record<string, string | number>;
  keywords: string[];
  embedding: number[];
}

export interface IRagCitation {
  citationTag: string;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  pageNumber: number;
  sectionHeading: string;
  verbatimExcerpt: string;
  relevanceScore: number;
}

export interface IRagQueryResponse {
  query: string;
  answer: string;
  grounded: boolean;
  refusedUnverifiedClaim: boolean;
  citations: IRagCitation[];
  latencyMs: number;
}

export interface IAuditLog {
  id: string;
  timestamp: string;
  eventType:
    | 'PLAN_GENERATED'
    | 'SUITABILITY_FLAG_RAISED'
    | 'ADVERSARIAL_PROMPT_BLOCKED'
    | 'RAG_CITATION_QUERY'
    | 'RIA_PLAN_APPROVED'
    | 'RIA_PLAN_REJECTED';
  actorName: string;
  actorRole: string;
  sebiRegNo: string;
  referenceId: string;
  summary: string;
  integrityHash: string;
}
