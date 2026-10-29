import { IClientPersona } from '../types/domain.types';

/**
 * The 6 Official Sample Test Personas from Zeckathon Problem Statement 04 (Page 1).
 */
export const OFFICIAL_PERSONAS_SEED: IClientPersona[] = [
  {
    id: 'persona-1',
    personaCode: 'PS04-P1',
    name: 'Fresh Graduate, Bengaluru',
    age: 23,
    city: 'Bengaluru',
    occupation: 'Software Engineer (Fresh Graduate)',
    tagLine: '₹55k/month take-home; no dependants → Emergency fund, then long-term wealth',
    situationSummary: '₹55,000/month take-home salary; zero dependants; zero debt EMI; ₹45,000 current bank balance.',
    goalTestSummary: 'Build a 6-month Emergency Fund first, then compound long-term wealth over 15+ years.',
    financials: {
      monthlyTakeHomeInr: 55000,
      monthlyExpensesInr: 30000,
      monthlyEmiInr: 0,
      liquidCashHoldingsInr: 45000,
      existingEquityInr: 20000,
      existingDebtPensionInr: 0,
      incomeStability: 'SALARIED_STABLE',
      dependantsCount: 0,
    },
    behaviouralQuestionnaire: {
      drawdownReaction: 'HOLD_CALMLY',
      returnPreference: 'HIGH_GROWTH',
      marketExperience: 'MUTUAL_FUNDS',
      maxAcceptableDrawdownPct: 20,
      clientStatedRequest:
        'I just started my first job in Bengaluru with ₹55k/month take-home and no dependants. Help me build an emergency fund first and then start long-term wealth creation.',
    },
    goals: [
      {
        goalId: 'g-p1-1',
        name: '6-Month Emergency Reserve Buffer',
        category: 'EMERGENCY',
        presentCostInr: 180000, // 6 x ₹30,000 monthly expenses
        horizonYears: 1,
        priority: 'CRITICAL',
        existingEarmarkedCorpusInr: 45000,
      },
      {
        goalId: 'g-p1-2',
        name: 'Long-Term Financial Independence & Wealth Corpus',
        category: 'WEALTH',
        presentCostInr: 5000000,
        horizonYears: 15,
        priority: 'HIGH',
        existingEarmarkedCorpusInr: 20000,
      },
    ],
    isOfficialSample: true,
    createdAt: '2026-10-29T10:00:00.000Z',
  },
  {
    id: 'persona-2',
    personaCode: 'PS04-P2',
    name: 'Young Couple, Pune',
    age: 31,
    city: 'Pune',
    occupation: 'Dual-Income IT & Product Professionals',
    tagLine: 'Dual income; home-loan EMI → Child’s education in 15 years',
    situationSummary:
      'Combined dual take-home income ₹1,65,000/month; active Home-Loan EMI of ₹42,000/month; 1 infant child.',
    goalTestSummary: 'Fund child’s undergraduate & postgraduate higher education in 15 years with inflation protection and de-risking glide path.',
    financials: {
      monthlyTakeHomeInr: 165000,
      monthlyExpensesInr: 58000,
      monthlyEmiInr: 42000,
      liquidCashHoldingsInr: 450000,
      existingEquityInr: 350000,
      existingDebtPensionInr: 250000,
      incomeStability: 'DUAL_INCOME',
      dependantsCount: 1,
    },
    behaviouralQuestionnaire: {
      drawdownReaction: 'HOLD_CALMLY',
      returnPreference: 'BALANCED',
      marketExperience: 'MUTUAL_FUNDS',
      maxAcceptableDrawdownPct: 18,
      clientStatedRequest:
        'We have a dual income in Pune with an ongoing ₹42k home-loan EMI. We want a disciplined 15-year plan for our child’s higher education that protects the corpus as college nears.',
    },
    goals: [
      {
        goalId: 'g-p2-1',
        name: 'Child’s Higher Education Corpus (15-Year Horizon)',
        category: 'EDUCATION',
        presentCostInr: 3000000, // ₹30L in today's terms -> ~₹1.02 Cr at 8.5% education inflation
        horizonYears: 15,
        priority: 'CRITICAL',
        existingEarmarkedCorpusInr: 350000,
      },
      {
        goalId: 'g-p2-2',
        name: 'Home-Loan EMI Contingency & Family Buffer',
        category: 'EMERGENCY',
        presentCostInr: 600000,
        horizonYears: 2,
        priority: 'HIGH',
        existingEarmarkedCorpusInr: 450000,
      },
    ],
    isOfficialSample: true,
    createdAt: '2026-10-29T10:00:00.000Z',
  },
  {
    id: 'persona-3',
    personaCode: 'PS04-P3',
    name: 'Small Business Owner, Surat',
    age: 44,
    city: 'Surat',
    occupation: 'Textile & Diamond Trading MSME Owner',
    tagLine: 'Irregular income; high cash holdings → Retirement at 58',
    situationSummary:
      'Irregular business cashflows averaging ₹2,10,000/month; holds ₹32,00,000 in idle savings/current account cash; 2 dependants.',
    goalTestSummary: 'Build retirement corpus by age 58 (14 years) while maintaining a 12-month liquidity cushion for irregular business income.',
    financials: {
      monthlyTakeHomeInr: 210000,
      monthlyExpensesInr: 85000,
      monthlyEmiInr: 18000,
      liquidCashHoldingsInr: 3200000,
      existingEquityInr: 600000,
      existingDebtPensionInr: 400000,
      incomeStability: 'IRREGULAR_BUSINESS',
      dependantsCount: 2,
    },
    behaviouralQuestionnaire: {
      drawdownReaction: 'HOLD_NERVOUSLY',
      returnPreference: 'BALANCED',
      marketExperience: 'MUTUAL_FUNDS',
      maxAcceptableDrawdownPct: 15,
      clientStatedRequest:
        'My textile business income in Surat is seasonal and irregular, so I keep ₹32 lakh idle in bank cash. I want to retire comfortably at age 58 without jeopardizing business working capital.',
    },
    goals: [
      {
        goalId: 'g-p3-1',
        name: '12-Month Irregular Income & Business Liquidity Buffer',
        category: 'EMERGENCY',
        presentCostInr: 1020000,
        horizonYears: 1,
        priority: 'CRITICAL',
        existingEarmarkedCorpusInr: 1020000, // Carved out from ₹32L cash
      },
      {
        goalId: 'g-p3-2',
        name: 'Retirement Corpus at Age 58 (14-Year Horizon)',
        category: 'RETIREMENT',
        presentCostInr: 12000000, // Present value equivalent of retirement security
        horizonYears: 14,
        priority: 'CRITICAL',
        existingEarmarkedCorpusInr: 2180000, // Remaining ₹21.8L excess cash deployed via STP + existing investments
      },
    ],
    isOfficialSample: true,
    createdAt: '2026-10-29T10:00:00.000Z',
  },
  {
    id: 'persona-4',
    personaCode: 'PS04-P4',
    name: 'Doctor, Patna',
    age: 38,
    city: 'Patna',
    occupation: 'Senior Consultant Physician',
    tagLine: 'High income; under-invested; risk-averse → Retirement + parents’ medical corpus',
    situationSummary:
      'High stable income of ₹3,20,000/month; heavily under-invested in growth assets (₹28L in low-yield FDs/savings); behaviourally risk-averse; ageing parents.',
    goalTestSummary:
      'Resolve High Risk Capacity vs Low Risk Tolerance conflict; build a 4-year Parents’ Medical Corpus + 22-year Retirement Plan.',
    financials: {
      monthlyTakeHomeInr: 320000,
      monthlyExpensesInr: 95000,
      monthlyEmiInr: 0,
      liquidCashHoldingsInr: 2800000,
      existingEquityInr: 150000,
      existingDebtPensionInr: 1200000,
      incomeStability: 'SALARIED_STABLE',
      dependantsCount: 3,
    },
    behaviouralQuestionnaire: {
      drawdownReaction: 'SELL_ALL',
      returnPreference: 'CAPITAL_SAFETY',
      marketExperience: 'NONE_FD_ONLY',
      maxAcceptableDrawdownPct: 8,
      clientStatedRequest:
        'I earn well in Patna but market crashes scare me—I keep almost everything in FDs. I need a dedicated medical corpus for my ageing parents in 4 years and my own retirement at 60.',
    },
    goals: [
      {
        goalId: 'g-p4-1',
        name: 'Parents’ Critical Medical & Hospitalization Corpus',
        category: 'MEDICAL',
        presentCostInr: 2000000,
        horizonYears: 4,
        priority: 'CRITICAL',
        existingEarmarkedCorpusInr: 800000,
      },
      {
        goalId: 'g-p4-2',
        name: 'Physician Retirement Corpus at Age 60',
        category: 'RETIREMENT',
        presentCostInr: 18000000,
        horizonYears: 22,
        priority: 'HIGH',
        existingEarmarkedCorpusInr: 2150000,
      },
    ],
    isOfficialSample: true,
    createdAt: '2026-10-29T10:00:00.000Z',
  },
  {
    id: 'persona-5',
    personaCode: 'PS04-P5',
    name: 'Retiree, Chennai',
    age: 68,
    city: 'Chennai',
    occupation: 'Retired Senior Government Engineer',
    tagLine: '₹80 lakh corpus; pension → Monthly income for 25 years (blocks small-cap request)',
    situationSummary:
      'Age 68 retiree in Chennai with ₹80,00,000 retirement corpus + ₹25,000/month pension; needs ₹65,000/month total living income (₹40,000/month net SWP from corpus) for 25 years.',
    goalTestSummary:
      'Generate safe inflation-adjusted monthly SWP income for 25 years; enforce hard guardrail blocking unsuitable high-risk / small-cap exposure.',
    financials: {
      monthlyTakeHomeInr: 25000, // Monthly pension
      monthlyExpensesInr: 65000,
      monthlyEmiInr: 0,
      liquidCashHoldingsInr: 5000000, // ₹50L in bank/maturing FD
      existingEquityInr: 500000,
      existingDebtPensionInr: 2500000, // Total ₹80L corpus across cash + debt + equity
      monthlyPensionInr: 25000,
      incomeStability: 'PENSION_RETIREE',
      dependantsCount: 1,
    },
    behaviouralQuestionnaire: {
      drawdownReaction: 'SELL_ALL',
      returnPreference: 'CAPITAL_SAFETY',
      marketExperience: 'NONE_FD_ONLY',
      maxAcceptableDrawdownPct: 5,
      clientStatedRequest:
        'I have ₹80 lakh corpus and a small pension in Chennai. My neighbour told me to put 100% into Small-Cap funds for high returns so my monthly income lasts 25 years—should I do that?',
    },
    goals: [
      {
        goalId: 'g-p5-1',
        name: '25-Year Monthly SWP Retirement Income Stream (Bucket 1 & 2)',
        category: 'SWP_INCOME',
        presentCostInr: 8000000,
        horizonYears: 25,
        priority: 'CRITICAL',
        existingEarmarkedCorpusInr: 7000000,
        targetMonthlySwpInr: 40000,
      },
      {
        goalId: 'g-p5-2',
        name: 'Senior Citizen Emergency Medical & Longevity Reserve',
        category: 'MEDICAL',
        presentCostInr: 1000000,
        horizonYears: 5,
        priority: 'CRITICAL',
        existingEarmarkedCorpusInr: 1000000,
      },
    ],
    isOfficialSample: true,
    createdAt: '2026-10-29T10:00:00.000Z',
  },
  {
    id: 'persona-6',
    personaCode: 'PS04-P6',
    name: 'Aggressive Trader, Mumbai',
    age: 29,
    city: 'Mumbai',
    occupation: 'Sales Manager & Retail F&O Trader',
    tagLine: 'F&O; losses; wants “high returns fast” → Co-pilot must handle suitability',
    situationSummary:
      'Age 29 in Mumbai; ₹95,000/month salary; suffered ₹6,50,000 realized losses in Nifty/BankNifty F&O options; only ₹60,000 liquid cash left; demands 30% fast returns to recover losses.',
    goalTestSummary:
      'Enforce SEBI suitability & behavioural guardrails: block speculative/guaranteed return requests, cap risk to constrained Risk Capacity, and rebuild emergency reserve first.',
    financials: {
      monthlyTakeHomeInr: 95000,
      monthlyExpensesInr: 48000,
      monthlyEmiInr: 15000, // Personal loan / credit card EMI from trading
      liquidCashHoldingsInr: 60000,
      existingEquityInr: 40000,
      existingDebtPensionInr: 0,
      fnoCumulativeLossesInr: 650000,
      incomeStability: 'VOLATILE_TRADER',
      dependantsCount: 1,
    },
    behaviouralQuestionnaire: {
      drawdownReaction: 'BUY_MORE',
      returnPreference: 'FAST_HIGH_RETURNS',
      marketExperience: 'FNO_LOSSES',
      maxAcceptableDrawdownPct: 35,
      clientStatedRequest:
        'I lost ₹6.5 lakh in F&O options trading in Mumbai. Give me an aggressive small-cap or thematic fund that guarantees 25-30% returns fast so I can recover my losses in 1 year!',
    },
    goals: [
      {
        goalId: 'g-p6-1',
        name: 'Mandatory Emergency & Debt-Stabilization Reserve',
        category: 'EMERGENCY',
        presentCostInr: 300000,
        horizonYears: 1,
        priority: 'CRITICAL',
        existingEarmarkedCorpusInr: 60000,
      },
      {
        goalId: 'g-p6-2',
        name: 'Disciplined Core Wealth Recovery & Long-Term Growth',
        category: 'WEALTH',
        presentCostInr: 3500000,
        horizonYears: 10,
        priority: 'HIGH',
        existingEarmarkedCorpusInr: 40000,
      },
    ],
    isOfficialSample: true,
    createdAt: '2026-10-29T10:00:00.000Z',
  },
];
