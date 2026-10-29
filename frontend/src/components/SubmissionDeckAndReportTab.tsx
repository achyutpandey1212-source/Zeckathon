import React from 'react';
import { IFinancialPlan } from '../types/api.types';
import {
  FileCheck,
  Lock,
  Printer,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  activePlan: IFinancialPlan;
  allPlans: IFinancialPlan[];
  onApproveQuick: () => void;
}

export const SubmissionDeckAndReportTab: React.FC<Props> = ({
  activePlan,
  allPlans,
  onApproveQuick,
}) => {
  const isApproved = activePlan.approvalWorkflow.clientExportUnlocked;

  return (
    <div className="space-y-14">
      {/* Spacious Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#e8e6dc] no-print">
        <div>
          <p className="text-sm font-heading text-[#d97757] font-medium mb-2">
            Client-Facing Output Gate & Master Answer Key
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-[#141413] tracking-tight">
            Signed Client Report & 6-Persona Matrix
          </h2>
          <p className="text-base text-[#141413]/70 mt-3 max-w-2xl leading-relaxed">
            Every figure in this report is deterministically computed by the quantitative engine and matches{' '}
            <code className="text-[#141413] font-mono text-sm">SUBMISSION_REPORT.md</code> 1:1.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!isApproved && (
            <button
              onClick={onApproveQuick}
              className="px-5 py-3 bg-[#788c5d] hover:bg-[#677a4e] text-white font-heading text-sm font-medium rounded-full flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Approve & Sign Plan
            </button>
          )}
          <button
            onClick={() => window.print()}
            disabled={!isApproved}
            className={`px-6 py-3 font-heading text-sm font-medium rounded-full flex items-center gap-2 transition-colors ${
              isApproved
                ? 'bg-[#141413] hover:bg-[#2a2a28] text-[#faf9f5] cursor-pointer'
                : 'bg-[#e8e6dc] text-[#141413]/40 cursor-not-allowed'
            }`}
          >
            <Printer className="w-4 h-4" />
            {isApproved ? 'Print / Save PDF' : 'Locked Until RIA Approval'}
          </button>
        </div>
      </div>

      {/* Approval Status Banner */}
      {!isApproved ? (
        <div className="bg-white border border-[#b83a2d]/40 rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#b83a2d]/10 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[#b83a2d]" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-semibold text-[#141413]">
                Client Release Locked — Awaiting SEBI RIA Sign-Off
              </h3>
              <p className="text-sm text-[#141413]/70 mt-1 max-w-2xl leading-relaxed">
                Plan <strong>{activePlan.planReferenceCode}</strong> for{' '}
                <strong>{activePlan.personaSnapshot.name}</strong> is in draft state. Under SEBI IA Regulations 2013, no
                recommendation can reach a client without explicit human adviser approval.
              </p>
            </div>
          </div>
          <button
            onClick={onApproveQuick}
            className="px-6 py-3 bg-[#141413] hover:bg-[#2a2a28] text-[#faf9f5] font-heading text-sm font-medium rounded-full shrink-0 cursor-pointer"
          >
            Sign as SEBI RIA (INA000018492)
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#788c5d]/50 rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#788c5d]/15 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5 text-[#788c5d]" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-semibold text-[#141413]">
                Approved for Client Release • SEBI Reg. No. {activePlan.approvalWorkflow.reviewedBySebiRegNo}
              </h3>
              <p className="text-xs font-mono text-[#141413]/60 mt-1">
                Signed by {activePlan.approvalWorkflow.reviewedByAdviserName} • SHA-256 Seal:{' '}
                {activePlan.approvalWorkflow.digitalSignatureHash}
              </p>
            </div>
          </div>
          <span className="px-4 py-1.5 rounded-full bg-[#788c5d]/15 text-[#788c5d] font-mono text-xs font-semibold shrink-0">
            ✓ Client Export Unlocked
          </span>
        </div>
      )}

      {/* 6-Persona Master Reproducibility Table */}
      <div className="bg-white rounded-2xl border border-[#e8e6dc] p-8 sm:p-10 shadow-[0_2px_12px_rgba(20,20,19,0.03)] space-y-6">
        <div className="pb-6 border-b border-[#e8e6dc]">
          <h3 className="text-xl font-heading font-semibold text-[#141413]">
            All 6 Sample Personas — Reproducible Answer Key
          </h3>
          <p className="text-sm text-[#141413]/65 mt-1">
            Summary of Risk Capacity ($RC$), Risk Tolerance ($RT$), Resolved Effective Risk Score ($ERS$), Asset
            Allocation, Monthly SIP/SWP, and 10-Year Backtest CAGR.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#e8e6dc] text-xs font-heading text-[#141413]/55">
                <th className="py-4 px-4">Persona</th>
                <th className="py-4 px-4">Capacity (RC)</th>
                <th className="py-4 px-4">Tolerance (RT)</th>
                <th className="py-4 px-4">Resolved ERS</th>
                <th className="py-4 px-4">Mix (Eq/Hyb/Debt/Liq)</th>
                <th className="py-4 px-4">Monthly SIP / SWP</th>
                <th className="py-4 px-4">10Y Backtest CAGR</th>
                <th className="py-4 px-4">Max Drawdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e6dc]">
              {allPlans.map((p) => {
                const alloc = p.portfolioConstruction.blendedAllocation;
                const bt = p.portfolioConstruction.tenYearBacktest;
                return (
                  <tr
                    key={p.id}
                    className={p.id === activePlan.id ? 'bg-[#faf9f5] font-medium' : 'hover:bg-[#faf9f5]/60'}
                  >
                    <td className="py-4 px-4">
                      <div className="font-heading font-semibold text-[#141413]">{p.personaSnapshot.name}</div>
                      <div className="text-xs text-[#141413]/55">Age {p.personaSnapshot.age}</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs">{p.riskProfile.riskCapacityScore}/100</td>
                    <td className="py-4 px-4 font-mono text-xs">{p.riskProfile.riskToleranceScore}/100</td>
                    <td className="py-4 px-4 font-mono text-xs font-semibold text-[#d97757]">
                      {p.riskProfile.effectiveRiskScore}/100 ({p.riskProfile.effectiveRiskTier})
                    </td>
                    <td className="py-4 px-4 font-mono text-xs">
                      {alloc.equityPct}% / {alloc.hybridGoldPct}% / {alloc.debtPct}% / {alloc.liquidPct}%
                    </td>
                    <td className="py-4 px-4 font-mono text-xs font-semibold">
                      ₹{p.portfolioConstruction.totalMonthlySipInr.toLocaleString('en-IN')}
                      {p.personaSnapshot.personaCode === 'PS04-P5' && ' (₹40k SWP)'}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-[#788c5d] font-semibold">
                      {bt.portfolioCagr10YrPct}%
                    </td>
                    <td className="py-4 px-4 font-mono text-xs">{bt.maxDrawdownPct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Client Investment Charter */}
      <div className="bg-white rounded-2xl border border-[#e8e6dc] p-8 sm:p-10 shadow-[0_2px_12px_rgba(20,20,19,0.03)] space-y-8">
        <div className="pb-6 border-b border-[#e8e6dc] flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#141413]/50 mb-1">{activePlan.planReferenceCode}</div>
            <h3 className="text-2xl font-heading font-semibold text-[#141413]">
              Fiduciary Investment Charter — {activePlan.personaSnapshot.name}
            </h3>
          </div>
          <span className="text-xs font-mono text-[#141413]/55">
            Generated in {activePlan.generationLatencyMs}ms
          </span>
        </div>

        <p className="text-base text-[#141413]/90 leading-relaxed max-w-[68ch]">
          {activePlan.aiCoPilotMemo.executiveSummary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="space-y-2">
            <h4 className="text-sm font-heading font-semibold text-[#141413]">
              Risk Capacity vs. Risk Tolerance Resolution
            </h4>
            <p className="text-sm text-[#141413]/75 leading-relaxed">
              {activePlan.aiCoPilotMemo.riskConflictCommentary}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-heading font-semibold text-[#141413]">
              Direct-Plan Portfolio & Source Citations
            </h4>
            <p className="text-sm text-[#141413]/75 leading-relaxed">
              {activePlan.aiCoPilotMemo.portfolioSelectionCommentary}
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-[#e8e6dc] text-xs text-[#141413]/55 leading-relaxed">
          {activePlan.complianceGuardrails.fiduciaryConflictOfInterestDisclosure}
        </div>
      </div>
    </div>
  );
};
