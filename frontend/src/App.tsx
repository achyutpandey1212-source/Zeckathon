import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { api } from './services/api';
import {
  IClientPersona,
  IFinancialPlan,
  IHealthTelemetry,
} from './types/api.types';
import { BacktestChartAndGlidePath } from './components/BacktestChartAndGlidePath';
import { RagResearchTab } from './components/RagResearchTab';
import { GuardrailsAndHitlTab } from './components/GuardrailsAndHitlTab';
import { SubmissionDeckAndReportTab } from './components/SubmissionDeckAndReportTab';
import {
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Plus,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';

gsap.registerPlugin(useGSAP);

type ActiveTab = 'WORKBENCH' | 'RAG_ASSISTANT' | 'GUARDRAILS' | 'REPORT_DECK';
type PlanSubView = 'ALL' | 'RISK_AND_APPROVAL' | 'GOALS_AND_GLIDE' | 'PORTFOLIO_AND_BACKTEST';

export function App() {
  const mainRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('WORKBENCH');
  const [planSubView, setPlanSubView] = useState<PlanSubView>('ALL');
  const [personas, setPersonas] = useState<IClientPersona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('persona-1');
  const [activePlan, setActivePlan] = useState<IFinancialPlan | null>(null);
  const [allPlansMap, setAllPlansMap] = useState<Record<string, IFinancialPlan>>({});
  const [health, setHealth] = useState<IHealthTelemetry | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<boolean>(true);
  const [aiRefreshing, setAiRefreshing] = useState<boolean>(false);

  // Adviser Approval State
  const [adviserNotes, setAdviserNotes] = useState<string>(
    'Verified Risk Capacity vs Tolerance resolution, RBI DBIE inflation-adjusted SIPs, AMFI Direct-Plan metrics, and page-level SID citations. Approved for client execution.'
  );
  const [approving, setApproving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Persona Modal State
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customName, setCustomName] = useState('Ananya & Rohit Verma, Hyderabad');
  const [customAge, setCustomAge] = useState(35);
  const [customIncome, setCustomIncome] = useState(185000);
  const [customExpenses, setCustomExpenses] = useState(65000);
  const [customEmi, setCustomEmi] = useState(25000);
  const [customCash, setCustomCash] = useState(600000);
  const [customGoalName, setCustomGoalName] = useState('Daughter’s Global University Fund');
  const [customGoalCost, setCustomGoalCost] = useState(4000000);
  const [customGoalHorizon, setCustomGoalHorizon] = useState(12);
  const [customRequest, setCustomRequest] = useState(
    'We want a balanced goal plan for our daughter’s education in 12 years using low-cost AMFI direct plans.'
  );

  useEffect(() => {
    void bootstrapApp();
    const interval = setInterval(() => {
      void api.getHealth().then(setHealth).catch(() => {});
    }, 240000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const bootstrapApp = async () => {
    setLoadingPlan(true);
    try {
      await api.initDemoSession();
      const [personaList, healthData] = await Promise.all([
        api.getPersonas(),
        api.getHealth(),
      ]);
      setPersonas(personaList);
      setHealth(healthData);

      const plansEntries = await Promise.all(
        personaList.map(async (p) => {
          const pl = await api.getPlanByPersona(p.id);
          return [p.id, pl] as const;
        })
      );
      const mapObj: Record<string, IFinancialPlan> = {};
      for (const [pid, pl] of plansEntries) {
        mapObj[pid] = pl;
      }
      setAllPlansMap(mapObj);
      if (personaList.length > 0) {
        const firstId = personaList[0].id;
        setSelectedPersonaId(firstId);
        setActivePlan(mapObj[firstId]);
      }
    } catch (err) {
      console.error('Bootstrap error:', err);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleSelectPersona = async (personaId: string) => {
    setSelectedPersonaId(personaId);
    if (allPlansMap[personaId]) {
      setActivePlan(allPlansMap[personaId]);
      return;
    }
    setLoadingPlan(true);
    try {
      const plan = await api.getPlanByPersona(personaId);
      setAllPlansMap((prev) => ({ ...prev, [personaId]: plan }));
      setActivePlan(plan);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleRegenerateWithAi = async () => {
    if (!activePlan) return;
    setAiRefreshing(true);
    try {
      const updated = await api.generatePlan(selectedPersonaId, true);
      setActivePlan(updated);
      setAllPlansMap((prev) => ({ ...prev, [selectedPersonaId]: updated }));
      showToast('Updated executive narrative via Single-Provider AI Gateway.');
    } finally {
      setAiRefreshing(false);
    }
  };

  const handleApprovePlan = async (action: 'APPROVE' | 'OVERRIDE_AND_APPROVE' | 'REJECT' = 'APPROVE') => {
    if (!activePlan) return;
    setApproving(true);
    try {
      const updated = await api.approvePlan(activePlan.id, {
        action,
        adviserNotes,
      });
      setActivePlan(updated);
      setAllPlansMap((prev) => ({ ...prev, [selectedPersonaId]: updated }));
      showToast(
        action === 'REJECT'
          ? `Plan ${updated.planReferenceCode} rejected.`
          : `Plan ${updated.planReferenceCode} signed & unlocked by SEBI RIA.`
      );
    } finally {
      setApproving(false);
    }
  };

  const handleCreateCustomPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createCustomPersona({
      name: customName,
      age: Number(customAge),
      city: customName.split(',')[1]?.trim() || 'India',
      occupation: 'Advisory Client',
      tagLine: `₹${(Number(customIncome) / 1000).toFixed(0)}k/mo income → ${customGoalName}`,
      situationSummary: `Monthly take-home ₹${Number(customIncome).toLocaleString('en-IN')}; Expenses ₹${Number(
        customExpenses
      ).toLocaleString('en-IN')}; EMI ₹${Number(customEmi).toLocaleString('en-IN')}; Cash ₹${Number(
        customCash
      ).toLocaleString('en-IN')}.`,
      goalTestSummary: `${customGoalName} in ${customGoalHorizon} years (Present cost ₹${Number(
        customGoalCost
      ).toLocaleString('en-IN')}).`,
      financials: {
        monthlyTakeHomeInr: Number(customIncome),
        monthlyExpensesInr: Number(customExpenses),
        monthlyEmiInr: Number(customEmi),
        liquidCashHoldingsInr: Number(customCash),
        existingEquityInr: 250000,
        existingDebtPensionInr: 150000,
        incomeStability: 'SALARIED_STABLE',
        dependantsCount: 1,
      },
      behaviouralQuestionnaire: {
        drawdownReaction: 'HOLD_CALMLY',
        returnPreference: 'BALANCED',
        marketExperience: 'MUTUAL_FUNDS',
        maxAcceptableDrawdownPct: 15,
        clientStatedRequest: customRequest,
      },
      goals: [
        {
          goalId: `g-custom-${Date.now()}`,
          name: customGoalName,
          category: 'EDUCATION',
          presentCostInr: Number(customGoalCost),
          horizonYears: Number(customGoalHorizon),
          priority: 'CRITICAL',
          existingEarmarkedCorpusInr: 250000,
        },
      ],
    });

    setPersonas((prev) => [...prev, res.persona]);
    setAllPlansMap((prev) => ({ ...prev, [res.persona.id]: res.plan }));
    setSelectedPersonaId(res.persona.id);
    setActivePlan(res.plan);
    setShowCustomModal(false);
    showToast(`Created client "${res.persona.name}" and generated plan.`);
  };

  useGSAP(
    () => {
      const targets = gsap.utils.toArray('.gsap-section-fade');
      if (targets.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add(
        {
          motionOk: '(prefers-reduced-motion: no-preference)',
          reduce: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { reduce } = context.conditions || {};
          gsap.fromTo(
            targets,
            { autoAlpha: 0, y: 12 },
            {
              autoAlpha: 1,
              y: 0,
              duration: reduce ? 0 : 0.45,
              stagger: reduce ? 0 : 0.07,
              ease: 'power2.out',
            }
          );
        }
      );
      return () => mm.revert();
    },
    { scope: mainRef, dependencies: [selectedPersonaId, activeTab, planSubView, Boolean(activePlan)] }
  );

  return (
    <div ref={mainRef} className="min-h-screen flex flex-col bg-[#faf9f5] text-[#141413]">
      {/* MINIMAL, BREATHABLE TOP NAVIGATION BAR */}
      <header className="bg-[#faf9f5]/95 backdrop-blur-sm border-b border-[#e8e6dc] sticky top-0 z-30 no-print">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between gap-6">
          {/* Clean Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#141413] flex items-center justify-center font-heading font-semibold text-[#faf9f5] text-sm">
              A
            </div>
            <div>
              <span className="text-base font-heading font-semibold tracking-tight text-[#141413]">
                ArthaGuard
              </span>
              <span className="hidden sm:inline-block ml-3 text-xs font-mono text-[#141413]/45">
                SEBI RIA INA000018492
              </span>
            </div>
          </div>

          {/* Spacious Center Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {[
              { id: 'WORKBENCH' as ActiveTab, label: 'Client Plan' },
              { id: 'RAG_ASSISTANT' as ActiveTab, label: 'Fund Research (RAG)' },
              { id: 'GUARDRAILS' as ActiveTab, label: 'Guardrails' },
              { id: 'REPORT_DECK' as ActiveTab, label: 'Summary Report' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-heading font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-[#141413] text-[#faf9f5]'
                      : 'text-[#141413]/65 hover:text-[#141413] hover:bg-[#e8e6dc]/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCustomModal(true)}
              className="px-4 py-2 rounded-full border border-[#141413]/20 hover:border-[#141413] text-xs font-heading font-medium text-[#141413] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Client</span>
            </button>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#141413] text-[#faf9f5] px-5 py-3.5 rounded-full shadow-xl text-xs font-heading flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#788c5d] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTAINER WITH GENEROUS NEGATIVE SPACE */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-10 py-12 sm:py-16">
        {activeTab === 'RAG_ASSISTANT' && <RagResearchTab />}
        {activeTab === 'GUARDRAILS' && <GuardrailsAndHitlTab />}
        {activeTab === 'REPORT_DECK' && activePlan && (
          <SubmissionDeckAndReportTab
            activePlan={activePlan}
            allPlans={Object.values(allPlansMap)}
            onApproveQuick={() => handleApprovePlan('APPROVE')}
          />
        )}

        {activeTab === 'WORKBENCH' && (
          <div className="space-y-16">
            {/* CLEAN HORIZONTAL PERSONA SELECTOR */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-medium text-[#141413]/50">
                  Select Client Profile ({personas.length})
                </span>
                <button
                  onClick={handleRegenerateWithAi}
                  disabled={aiRefreshing}
                  className="text-xs font-heading text-[#141413]/60 hover:text-[#141413] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${aiRefreshing ? 'animate-spin' : ''}`} />
                  <span>{aiRefreshing ? 'Refreshing narrative...' : 'Refresh AI commentary'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {personas.map((p) => {
                  const isSelected = p.id === selectedPersonaId;
                  const planForP = allPlansMap[p.id];
                  const isApproved = planForP?.approvalWorkflow.clientExportUnlocked;
                  const hasCriticalBlock = planForP?.complianceGuardrails.suitabilityAlerts.some(
                    (a) => a.severity === 'CRITICAL_BLOCK'
                  );

                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPersona(p.id)}
                      className={`px-4 py-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-[#141413] text-[#faf9f5] border-[#141413] shadow-sm'
                          : 'bg-white text-[#141413] border-[#e8e6dc] hover:border-[#141413]/40'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isApproved
                            ? 'bg-[#788c5d]'
                            : hasCriticalBlock
                            ? 'bg-[#b83a2d]'
                            : 'bg-[#d97757]'
                        }`}
                      />
                      <div>
                        <div className="text-xs sm:text-sm font-heading font-medium leading-none">
                          {p.name}
                        </div>
                        <div
                          className={`text-[11px] font-mono mt-1 ${
                            isSelected ? 'text-[#faf9f5]/65' : 'text-[#141413]/50'
                          }`}
                        >
                          Age {p.age} • ERS {planForP?.riskProfile.effectiveRiskScore ?? '--'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {loadingPlan || !activePlan ? (
              <div className="py-24 text-center text-base font-heading text-[#141413]/55">
                Computing financial plan...
              </div>
            ) : (
              <>
                {/* HERO CLIENT SUMMARY & HIGH-HIERARCHY METRICS */}
                <section className="gsap-section-fade space-y-10 pb-12 border-b border-[#e8e6dc]">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex items-center gap-3 text-xs font-mono text-[#141413]/55">
                        <span>{activePlan.planReferenceCode}</span>
                        <span>•</span>
                        <span>Age {activePlan.personaSnapshot.age}</span>
                        <span>•</span>
                        <span>{activePlan.personaSnapshot.occupation}</span>
                      </div>

                      <h1 className="text-3xl sm:text-5xl font-heading font-semibold tracking-tight text-[#141413] leading-[1.15]">
                        {activePlan.personaSnapshot.name}
                      </h1>

                      <p className="text-base sm:text-lg text-[#141413]/75 leading-relaxed pt-1">
                        {activePlan.personaSnapshot.situationSummary}
                      </p>
                    </div>

                    {/* Adviser Sign-Off Status Pill */}
                    <div className="shrink-0 flex flex-col items-start lg:items-end gap-3">
                      {activePlan.approvalWorkflow.clientExportUnlocked ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#788c5d]/15 text-[#788c5d] text-xs font-heading font-semibold">
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Approved by SEBI RIA ({activePlan.approvalWorkflow.reviewedBySebiRegNo})</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApprovePlan('APPROVE')}
                          disabled={approving}
                          className="px-6 py-3 rounded-full bg-[#d97757] hover:bg-[#c56747] text-white text-xs sm:text-sm font-heading font-medium flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>{approving ? 'Signing...' : 'Approve & Sign Plan for Client'}</span>
                        </button>
                      )}
                      <span className="text-xs font-mono text-[#141413]/45">
                        Computed in {activePlan.generationLatencyMs}ms (saves ~4.5h manual work)
                      </span>
                    </div>
                  </div>

                  {/* 4 Clean Hero Typography Metrics (No Box Clutter) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-6">
                    <div>
                      <div className="text-xs font-heading text-[#141413]/55">Effective Risk Score</div>
                      <div className="text-3xl sm:text-4xl font-heading font-semibold text-[#141413] mt-1 tracking-tight">
                        {activePlan.riskProfile.effectiveRiskScore}
                        <span className="text-lg text-[#141413]/40 font-normal"> / 100</span>
                      </div>
                      <div className="text-xs font-mono text-[#d97757] mt-1">
                        {activePlan.riskProfile.effectiveRiskTier.replace(/_/g, ' ')} (≤
                        {activePlan.riskProfile.maxAllowedEquityPct}% Equity)
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-heading text-[#141413]/55">
                        {activePlan.personaSnapshot.personaCode === 'PS04-P5'
                          ? 'Monthly SWP Income'
                          : 'Recommended Monthly SIP'}
                      </div>
                      <div className="text-3xl sm:text-4xl font-heading font-semibold text-[#141413] mt-1 tracking-tight">
                        {activePlan.personaSnapshot.personaCode === 'PS04-P5'
                          ? '₹40,000'
                          : `₹${activePlan.portfolioConstruction.totalMonthlySipInr.toLocaleString('en-IN')}`}
                      </div>
                      <div className="text-xs font-mono text-[#141413]/55 mt-1">
                        + ₹{(activePlan.portfolioConstruction.totalLumpSumDeploymentInr / 100000).toFixed(2)}L initial
                        capital
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-heading text-[#141413]/55">10-Year Backtest CAGR</div>
                      <div className="text-3xl sm:text-4xl font-heading font-semibold text-[#788c5d] mt-1 tracking-tight">
                        {activePlan.portfolioConstruction.tenYearBacktest.portfolioCagr10YrPct}%
                      </div>
                      <div className="text-xs font-mono text-[#141413]/55 mt-1">
                        vs {activePlan.portfolioConstruction.tenYearBacktest.benchmarkCagr10YrPct}% benchmark
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-heading text-[#141413]/55">Direct-Plan Cost (TER)</div>
                      <div className="text-3xl sm:text-4xl font-heading font-semibold text-[#141413] mt-1 tracking-tight">
                        {activePlan.portfolioConstruction.weightedExpenseRatioPct}%
                      </div>
                      <div className="text-xs font-mono text-[#788c5d] mt-1">
                        0.00% Distributor Commission
                      </div>
                    </div>
                  </div>

                  {/* Calm Editorial Executive Narrative */}
                  <div className="bg-white rounded-2xl border border-[#e8e6dc] p-8 sm:p-10 shadow-[0_2px_12px_rgba(20,20,19,0.03)]">
                    <div className="text-xs font-heading font-medium text-[#d97757] mb-3">
                      Co-Pilot Fiduciary Synthesis (Grounded with Source Citations)
                    </div>
                    <p className="text-base sm:text-lg text-[#141413]/90 leading-relaxed max-w-[70ch]">
                      {activePlan.aiCoPilotMemo.executiveSummary}
                    </p>
                  </div>

                  {/* Focused Section Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-xs font-heading text-[#141413]/45 mr-2">Focus View:</span>
                    {[
                      { id: 'ALL' as PlanSubView, label: 'All Sections' },
                      { id: 'RISK_AND_APPROVAL' as PlanSubView, label: '1. Risk & Suitability' },
                      { id: 'GOALS_AND_GLIDE' as PlanSubView, label: '2. Goals & Glide Path' },
                      { id: 'PORTFOLIO_AND_BACKTEST' as PlanSubView, label: '3. Portfolio & 10Y Backtest' },
                    ].map((sv) => (
                      <button
                        key={sv.id}
                        onClick={() => setPlanSubView(sv.id)}
                        className={`px-4 py-2 rounded-full text-xs font-heading font-medium transition-colors cursor-pointer ${
                          planSubView === sv.id
                            ? 'bg-[#141413] text-[#faf9f5]'
                            : 'bg-white border border-[#e8e6dc] text-[#141413]/70 hover:text-[#141413]'
                        }`}
                      >
                        {sv.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* SECTION 1: RISK CAPACITY VS TOLERANCE & SUITABILITY GUARDRAILS */}
                {(planSubView === 'ALL' || planSubView === 'RISK_AND_APPROVAL') && (
                  <section className="gsap-section-fade space-y-12">
                    <div className="max-w-2xl">
                      <p className="text-sm font-heading text-[#d97757] font-medium mb-1">
                        Deliverable 01 & 05 • Risk Profiling & Suitability
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-[#141413] tracking-tight">
                        Risk Capacity vs. Risk Tolerance Resolution
                      </h2>
                      <p className="text-base text-[#141413]/65 mt-2 leading-relaxed">
                        Separates objective financial ability to absorb loss from subjective behavioural attitude, and
                        resolves any conflict deterministically.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Capacity Card */}
                      <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e8e6dc] p-8 space-y-6 shadow-[0_2px_12px_rgba(20,20,19,0.03)]">
                        <div className="flex items-baseline justify-between border-b border-[#e8e6dc] pb-4">
                          <div>
                            <h3 className="text-base font-heading font-semibold text-[#141413]">
                              Risk Capacity (RC)
                            </h3>
                            <p className="text-xs text-[#141413]/55 mt-0.5">Objective Balance Sheet</p>
                          </div>
                          <span className="text-3xl font-heading font-semibold text-[#6a9bcc]">
                            {activePlan.riskProfile.riskCapacityScore}
                          </span>
                        </div>

                        <div className="space-y-4">
                          {[
                            { label: 'Investment Horizon', val: activePlan.riskProfile.capacityBreakdown.horizonScore },
                            {
                              label: 'Liquidity Reserve',
                              val: activePlan.riskProfile.capacityBreakdown.liquidityScore,
                            },
                            {
                              label: 'Debt / EMI Headroom',
                              val: activePlan.riskProfile.capacityBreakdown.debtBurdenScore,
                            },
                            {
                              label: 'Income Stability',
                              val: activePlan.riskProfile.capacityBreakdown.incomeStabilityScore,
                            },
                            {
                              label: 'Dependants Cushion',
                              val: activePlan.riskProfile.capacityBreakdown.dependantsScore,
                            },
                          ].map((item) => (
                            <div key={item.label} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-heading text-[#141413]/80">
                                <span>{item.label}</span>
                                <span className="font-mono">{item.val}/100</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#faf9f5] rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${item.val}%` }}
                                  className="h-full bg-[#6a9bcc] rounded-full"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tolerance Card */}
                      <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e8e6dc] p-8 space-y-6 shadow-[0_2px_12px_rgba(20,20,19,0.03)]">
                        <div className="flex items-baseline justify-between border-b border-[#e8e6dc] pb-4">
                          <div>
                            <h3 className="text-base font-heading font-semibold text-[#141413]">
                              Risk Tolerance (RT)
                            </h3>
                            <p className="text-xs text-[#141413]/55 mt-0.5">Subjective Behaviour</p>
                          </div>
                          <span className="text-3xl font-heading font-semibold text-[#d97757]">
                            {activePlan.riskProfile.riskToleranceScore}
                          </span>
                        </div>

                        <div className="space-y-4">
                          {[
                            {
                              label: 'Drawdown Reaction',
                              val: activePlan.riskProfile.toleranceBreakdown.drawdownReactionScore,
                            },
                            {
                              label: 'Return Preference',
                              val: activePlan.riskProfile.toleranceBreakdown.returnPreferenceScore,
                            },
                            {
                              label: 'Product Experience',
                              val: activePlan.riskProfile.toleranceBreakdown.experienceScore,
                            },
                            {
                              label: 'Volatility Comfort',
                              val: activePlan.riskProfile.toleranceBreakdown.volatilityComfortScore,
                            },
                          ].map((item) => (
                            <div key={item.label} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-heading text-[#141413]/80">
                                <span>{item.label}</span>
                                <span className="font-mono">{item.val}/100</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#faf9f5] rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${item.val}%` }}
                                  className="h-full bg-[#d97757] rounded-full"
                                />
                              </div>
                            </div>
                          ))}

                          {activePlan.riskProfile.toleranceBreakdown.behaviouralBiasFlag && (
                            <div className="p-3.5 rounded-xl bg-[#b83a2d]/5 border border-[#b83a2d]/25 text-xs text-[#b83a2d] leading-relaxed">
                              {activePlan.riskProfile.toleranceBreakdown.behaviouralBiasFlag}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Resolution Rule Card */}
                      <div className="lg:col-span-4 bg-white rounded-2xl border border-[#e8e6dc] p-8 flex flex-col justify-between space-y-6 shadow-[0_2px_12px_rgba(20,20,19,0.03)]">
                        <div className="space-y-4">
                          <div className="flex items-baseline justify-between border-b border-[#e8e6dc] pb-4">
                            <div>
                              <h3 className="text-base font-heading font-semibold text-[#141413]">
                                Conflict Resolution
                              </h3>
                              <p className="text-xs text-[#141413]/55 mt-0.5">SEBI IA Reg 16 & 17 Rule</p>
                            </div>
                            <span className="text-3xl font-heading font-semibold text-[#141413]">
                              {activePlan.riskProfile.effectiveRiskScore}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-[#faf9f5] border border-[#e8e6dc] font-mono text-xs text-[#141413]">
                            {activePlan.riskProfile.conflictResolutionFormula}
                          </div>

                          <p className="text-sm text-[#141413]/80 leading-relaxed">
                            {activePlan.riskProfile.conflictResolutionExplanation}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-[#e8e6dc] flex items-center justify-between text-xs font-mono">
                          <span className="text-[#141413]/55">Permitted Equity Ceiling</span>
                          <span className="font-semibold text-[#788c5d]">
                            ≤ {activePlan.riskProfile.maxAllowedEquityPct}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Suitability Alerts & Human-in-the-Loop Sign-Off */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-7 space-y-4">
                        {activePlan.complianceGuardrails.suitabilityAlerts.map((alert) => (
                          <div
                            key={alert.code}
                            className={`p-6 sm:p-8 rounded-2xl border space-y-3 ${
                              alert.severity === 'CRITICAL_BLOCK'
                                ? 'bg-[#b83a2d]/5 border-[#b83a2d]/40'
                                : 'bg-white border-[#e8e6dc]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-base font-heading font-semibold text-[#141413] flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-[#b83a2d] shrink-0" />
                                {alert.title}
                              </h4>
                              <span className="text-xs font-mono text-[#141413]/50">{alert.severity}</span>
                            </div>
                            <p className="text-sm text-[#141413]/80 leading-relaxed">{alert.whyUnsuitable}</p>
                            <p className="text-sm font-medium text-[#141413] pt-2 border-t border-[#e8e6dc]">
                              Remediation: {alert.coPilotOverrideAction}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Clean Human-in-the-Loop Approval Card */}
                      <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e8e6dc] p-8 flex flex-col justify-between space-y-6 shadow-[0_2px_12px_rgba(20,20,19,0.03)]">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-heading text-[#d97757] font-medium">
                              Human-in-the-Loop Gate
                            </span>
                            <span className="text-xs font-mono text-[#141413]/55">
                              {activePlan.approvalWorkflow.status}
                            </span>
                          </div>
                          <h3 className="text-lg font-heading font-semibold text-[#141413]">
                            SEBI RIA Review & Cryptographic Sign-Off
                          </h3>
                          <textarea
                            rows={3}
                            value={adviserNotes}
                            onChange={(e) => setAdviserNotes(e.target.value)}
                            className="w-full p-3.5 rounded-xl bg-[#faf9f5] border border-[#e8e6dc] text-sm text-[#141413] focus:outline-none focus:border-[#141413]"
                          />
                          {activePlan.approvalWorkflow.digitalSignatureHash && (
                            <div className="text-xs font-mono text-[#788c5d] truncate">
                              ✓ SHA-256 Seal: {activePlan.approvalWorkflow.digitalSignatureHash}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleApprovePlan('APPROVE')}
                            disabled={approving}
                            className="flex-1 py-3 px-5 rounded-full bg-[#141413] hover:bg-[#2a2a28] text-[#faf9f5] font-heading text-xs sm:text-sm font-medium cursor-pointer transition-colors"
                          >
                            {activePlan.approvalWorkflow.clientExportUnlocked
                              ? 'Update RIA Signature'
                              : 'Approve & Sign Plan'}
                          </button>
                          <button
                            onClick={() => setActiveTab('REPORT_DECK')}
                            className="py-3 px-5 rounded-full border border-[#e8e6dc] hover:border-[#141413] text-xs sm:text-sm font-heading font-medium cursor-pointer transition-colors"
                          >
                            Report →
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* SECTION 2: INFLATION-ADJUSTED GOALS & GLIDE PATH */}
                {(planSubView === 'ALL' || planSubView === 'GOALS_AND_GLIDE') && (
                  <section className="gsap-section-fade space-y-12 pt-4">
                    <div className="max-w-2xl">
                      <p className="text-sm font-heading text-[#6a9bcc] font-medium mb-1">
                        Deliverable 02 • Goal-Based Financial Plan
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-[#141413] tracking-tight">
                        Inflation-Adjusted Corpus, SIP & Glide Path
                      </h2>
                      <p className="text-base text-[#141413]/65 mt-2 leading-relaxed">
                        Grounded in RBI DBIE inflation series (6.0% Headline CPI, 8.5% Education, 9.5% Medical).
                      </p>
                    </div>

                    {/* Goal Cards instead of a cramped 9-column table */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {activePlan.goalPlans.map((g) => (
                        <div
                          key={g.goalId}
                          className="bg-white rounded-2xl border border-[#e8e6dc] p-8 space-y-6 shadow-[0_2px_12px_rgba(20,20,19,0.03)]"
                        >
                          <div className="flex items-start justify-between gap-4 border-b border-[#e8e6dc] pb-5">
                            <div>
                              <span className="text-xs font-mono text-[#d97757]">
                                {g.priority} • {g.horizonYears}-Year Horizon
                              </span>
                              <h3 className="text-lg font-heading font-semibold text-[#141413] mt-1">
                                {g.goalName}
                              </h3>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-[#faf9f5] border border-[#e8e6dc] text-xs font-mono">
                              {g.assumedInflationPct}% Inflation
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <div className="text-xs font-heading text-[#141413]/50">Future Required Corpus</div>
                              <div className="text-2xl font-heading font-semibold text-[#141413] mt-1">
                                ₹{(g.futureCorpusRequiredInr / 100000).toFixed(2)}L
                              </div>
                              <div className="text-xs font-mono text-[#141413]/50 mt-0.5">
                                Present: ₹{(g.presentCostInr / 100000).toFixed(2)}L
                              </div>
                            </div>

                            <div>
                              <div className="text-xs font-heading text-[#141413]/50">
                                {g.category === 'SWP_INCOME' ? 'Monthly SWP Payout' : 'Required Monthly SIP'}
                              </div>
                              <div className="text-2xl font-heading font-semibold text-[#788c5d] mt-1">
                                {g.category === 'SWP_INCOME'
                                  ? `₹${(g.swpMonthlyPayoutSupportedInr || 40000).toLocaleString('en-IN')}`
                                  : `₹${g.requiredMonthlySipInr.toLocaleString('en-IN')}`}
                              </div>
                              <div className="text-xs font-mono text-[#141413]/50 mt-0.5">
                                {g.category === 'SWP_INCOME'
                                  ? 'Sustained for 25 yrs'
                                  : `10% Step-Up: ₹${g.stepUpSip10PctInitialInr.toLocaleString('en-IN')}/mo`}
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-[#141413]/75 leading-relaxed pt-2 border-t border-[#e8e6dc]">
                            {g.executionNotes}
                          </p>
                        </div>
                      ))}
                    </div>

                    <BacktestChartAndGlidePath
                      portfolio={activePlan.portfolioConstruction}
                      goalPlans={activePlan.goalPlans}
                      mode="GLIDE_ONLY"
                    />
                  </section>
                )}

                {/* SECTION 3: AMFI DIRECT-PLAN PORTFOLIO & 10-YEAR BACKTEST */}
                {(planSubView === 'ALL' || planSubView === 'PORTFOLIO_AND_BACKTEST') && (
                  <section className="gsap-section-fade space-y-12 pt-4">
                    <div className="max-w-2xl">
                      <p className="text-sm font-heading text-[#788c5d] font-medium mb-1">
                        Deliverable 03 • Portfolio Construction & Backtest
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-[#141413] tracking-tight">
                        AMFI Direct-Plan Shortlist & 10-Year Performance
                      </h2>
                      <p className="text-base text-[#141413]/65 mt-2 leading-relaxed">
                        Screened using Total Expense Ratio (TER), Tracking Error, 3Y/5Y Rolling Returns, Max Drawdown,
                        AUM, and Fund Manager Tenure.
                      </p>
                    </div>

                    <BacktestChartAndGlidePath
                      portfolio={activePlan.portfolioConstruction}
                      goalPlans={activePlan.goalPlans}
                      mode="BACKTEST_ONLY"
                    />

                    {/* Clean, Breathable Shortlisted Funds Table */}
                    <div className="bg-white rounded-2xl border border-[#e8e6dc] p-8 sm:p-10 shadow-[0_2px_12px_rgba(20,20,19,0.03)] space-y-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-6 border-b border-[#e8e6dc]">
                        <h3 className="text-xl font-heading font-semibold text-[#141413]">
                          Recommended Direct-Plan Mutual Funds
                        </h3>
                        <span className="text-xs font-mono text-[#788c5d]">
                          Weighted TER: {activePlan.portfolioConstruction.weightedExpenseRatioPct}% • 0.00% Commission
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-[#e8e6dc] text-xs font-heading text-[#141413]/55">
                              <th className="py-4 px-4">Scheme & Manager</th>
                              <th className="py-4 px-4">Weight</th>
                              <th className="py-4 px-4">Monthly SIP</th>
                              <th className="py-4 px-4">TER</th>
                              <th className="py-4 px-4">5Y Rolling / 10Y CAGR</th>
                              <th className="py-4 px-4">Max Drawdown</th>
                              <th className="py-4 px-4">Source Page</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#e8e6dc]">
                            {activePlan.portfolioConstruction.shortlistedFunds.map((f) => (
                              <tr key={f.schemeCode} className="hover:bg-[#faf9f5]/70">
                                <td className="py-5 px-4">
                                  <div className="font-heading font-semibold text-[#141413]">
                                    {f.schemeName}
                                  </div>
                                  <div className="text-xs text-[#141413]/55 mt-0.5">
                                    {f.sebiCategory} • {f.managerName} ({f.managerTenureYears} yrs) • ₹
                                    {f.aumCr.toLocaleString('en-IN')} Cr AUM
                                  </div>
                                </td>
                                <td className="py-5 px-4 font-mono font-semibold text-[#141413]">
                                  {f.weightPct}%
                                </td>
                                <td className="py-5 px-4 font-mono text-[#788c5d] font-semibold">
                                  ₹{f.monthlySipAllocationInr.toLocaleString('en-IN')}
                                </td>
                                <td className="py-5 px-4 font-mono">{f.expenseRatioPct}%</td>
                                <td className="py-5 px-4 font-mono">
                                  {f.rollingReturn5YrCagrPct}% / <strong>{f.cagr10YrPct}%</strong>
                                </td>
                                <td className="py-5 px-4 font-mono">{f.maxDrawdownPct}%</td>
                                <td className="py-5 px-4">
                                  <button
                                    onClick={() => setActiveTab('RAG_ASSISTANT')}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#faf9f5] hover:bg-[#e8e6dc] border border-[#e8e6dc] text-xs font-mono text-[#141413] cursor-pointer transition-colors"
                                  >
                                    <span>Page {f.sourcePageNumber}</span>
                                    <ArrowUpRight className="w-3 h-3 text-[#141413]/50" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* CUSTOM CLIENT PERSONA BUILDER MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#e8e6dc] rounded-2xl max-w-xl w-full p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e8e6dc] pb-4">
              <div>
                <h3 className="text-lg font-heading font-semibold text-[#141413]">
                  New Client Profile
                </h3>
                <p className="text-xs text-[#141413]/55 mt-0.5">
                  Create a custom persona to test risk separation and goal planning
                </p>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-xs font-mono px-3 py-1.5 rounded-full bg-[#faf9f5] hover:bg-[#e8e6dc] cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateCustomPersona} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-[#141413]/70 mb-1.5">Client Name & City</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-heading text-[#141413]/70 mb-1.5">Age</label>
                  <input
                    type="number"
                    value={customAge}
                    onChange={(e) => setCustomAge(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-heading text-[#141413]/70 mb-1.5">Income (₹/mo)</label>
                  <input
                    type="number"
                    value={customIncome}
                    onChange={(e) => setCustomIncome(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-heading text-[#141413]/70 mb-1.5">Expenses (₹/mo)</label>
                  <input
                    type="number"
                    value={customExpenses}
                    onChange={(e) => setCustomExpenses(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-heading text-[#141413]/70 mb-1.5">EMI (₹/mo)</label>
                  <input
                    type="number"
                    value={customEmi}
                    onChange={(e) => setCustomEmi(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-heading text-[#141413]/70 mb-1.5">Cash (₹)</label>
                  <input
                    type="number"
                    value={customCash}
                    onChange={(e) => setCustomCash(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-heading text-[#141413]/70 mb-1.5">Goal Name</label>
                  <input
                    type="text"
                    value={customGoalName}
                    onChange={(e) => setCustomGoalName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-heading text-[#141413]/70 mb-1.5">Present Cost (₹)</label>
                  <input
                    type="number"
                    value={customGoalCost}
                    onChange={(e) => setCustomGoalCost(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-heading text-[#141413]/70 mb-1.5">Horizon (Yrs)</label>
                  <input
                    type="number"
                    value={customGoalHorizon}
                    onChange={(e) => setCustomGoalHorizon(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-heading text-[#141413]/70 mb-1.5">Client Request</label>
                <input
                  type="text"
                  value={customRequest}
                  onChange={(e) => setCustomRequest(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e8e6dc]">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-5 py-2.5 rounded-full border border-[#e8e6dc] font-heading font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#141413] text-[#faf9f5] font-heading font-medium cursor-pointer"
                >
                  Generate Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBTLE, SPACIOUS FOOTER */}
      <footer className="border-t border-[#e8e6dc] py-10 px-6 sm:px-10 text-xs font-mono text-[#141413]/50 mt-auto no-print">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>
            ArthaGuard AI • SEBI-Registered Investment Adviser Co-Pilot (INA000018492)
          </span>
          <div className="flex items-center gap-6">
            <span>Keep-Alive: {health?.keepAlive.intervalMinutes ?? 10}m Active</span>
            <span>100% Direct-Plan • 0% Commission</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
