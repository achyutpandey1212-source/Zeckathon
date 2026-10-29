import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { IGoalPlanOutput, IPortfolioConstructionOutput } from '../types/api.types';

gsap.registerPlugin(useGSAP);

interface Props {
  portfolio: IPortfolioConstructionOutput;
  goalPlans: IGoalPlanOutput[];
  mode?: 'BOTH' | 'GLIDE_ONLY' | 'BACKTEST_ONLY';
}

export const BacktestChartAndGlidePath: React.FC<Props> = ({
  portfolio,
  goalPlans,
  mode = 'BOTH',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedGoalIdx, setSelectedGoalIdx] = useState(0);
  const [hoveredYearIdx, setHoveredYearIdx] = useState<number | null>(null);

  const bt = portfolio.tenYearBacktest;
  const activeGoal = goalPlans[selectedGoalIdx] || goalPlans[0];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          isMotionAllowed: '(prefers-reduced-motion: no-preference)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { reduceMotion } = context.conditions || {};
          gsap.fromTo(
            '.gsap-bar-grow',
            { scaleX: 0, transformOrigin: 'left center' },
            {
              scaleX: 1,
              duration: reduceMotion ? 0 : 0.6,
              stagger: reduceMotion ? 0 : 0.05,
              ease: 'power2.out',
            }
          );
          gsap.fromTo(
            '.gsap-curve-fade',
            { autoAlpha: 0, y: 10 },
            {
              autoAlpha: 1,
              y: 0,
              duration: reduceMotion ? 0 : 0.5,
              ease: 'power2.out',
            }
          );
        }
      );
      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [portfolio, selectedGoalIdx, mode] }
  );

  // SVG coordinates for 10-year wealth curve
  const svgW = 760;
  const svgH = 260;
  const padL = 64;
  const padR = 28;
  const padT = 24;
  const padB = 38;

  const series = bt.yearlySeries;
  const allValues = [
    bt.initialInvestmentInr,
    ...series.map((s) => s.portfolioValueInr),
    ...series.map((s) => s.benchmarkValueInr),
  ];
  const minVal = Math.min(...allValues) * 0.92;
  const maxVal = Math.max(...allValues) * 1.06;

  const pointsCount = series.length + 1;
  const getX = (idx: number) => padL + (idx / (pointsCount - 1)) * (svgW - padL - padR);
  const getY = (val: number) =>
    padT + (1 - (val - minVal) / Math.max(1, maxVal - minVal)) * (svgH - padT - padB);

  const portPoints = [
    { x: getX(0), y: getY(bt.initialInvestmentInr), year: 2015, val: bt.initialInvestmentInr },
    ...series.map((s, i) => ({
      x: getX(i + 1),
      y: getY(s.portfolioValueInr),
      year: s.year,
      val: s.portfolioValueInr,
    })),
  ];

  const benchPoints = [
    { x: getX(0), y: getY(bt.initialInvestmentInr), year: 2015, val: bt.initialInvestmentInr },
    ...series.map((s, i) => ({
      x: getX(i + 1),
      y: getY(s.benchmarkValueInr),
      year: s.year,
      val: s.benchmarkValueInr,
    })),
  ];

  const portPathD = portPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const benchPathD = benchPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaPathD = `${portPathD} L ${portPoints[portPoints.length - 1].x.toFixed(1)} ${(
    svgH - padB
  ).toFixed(1)} L ${portPoints[0].x.toFixed(1)} ${(svgH - padB).toFixed(1)} Z`;

  return (
    <div ref={containerRef} className="space-y-14">
      {/* GLIDE PATH SECTION */}
      {(mode === 'BOTH' || mode === 'GLIDE_ONLY') && activeGoal && (
        <div className="bg-white rounded-2xl border border-[#e8e6dc] p-8 sm:p-10 shadow-[0_2px_12px_rgba(20,20,19,0.03)]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#e8e6dc]">
            <div>
              <h3 className="text-xl sm:text-2xl font-heading font-semibold text-[#141413] tracking-tight">
                Goal De-Risking Glide Path
              </h3>
              <p className="text-sm text-[#141413]/65 mt-1 max-w-xl">
                Systematic shift from growth equities into short-duration AAA debt and liquid reserves as the target
                year approaches.
              </p>
            </div>

            {goalPlans.length > 1 && (
              <div className="flex gap-2">
                {goalPlans.map((g, idx) => (
                  <button
                    key={g.goalId}
                    onClick={() => setSelectedGoalIdx(idx)}
                    className={`px-4 py-2 text-xs font-heading font-medium rounded-full transition-all cursor-pointer ${
                      selectedGoalIdx === idx
                        ? 'bg-[#141413] text-[#faf9f5]'
                        : 'bg-[#faf9f5] text-[#141413]/70 hover:text-[#141413] border border-[#e8e6dc]'
                    }`}
                  >
                    {g.goalName.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 space-y-6">
            {activeGoal.glidePathSchedule.map((step) => (
              <div key={step.yearOffset} className="space-y-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-base font-heading font-semibold text-[#141413]">
                      {step.calendarYear}
                    </span>
                    <span className="text-sm font-heading text-[#141413]/75">{step.phaseLabel}</span>
                  </div>
                  <span className="text-xs font-mono text-[#141413]/55">
                    {step.yearsRemaining === 0 ? 'Goal Maturity' : `${step.yearsRemaining} yrs remaining`}
                  </span>
                </div>

                {/* Clean, tall stacked bar */}
                <div className="w-full h-7 rounded-lg overflow-hidden flex bg-[#faf9f5] border border-[#e8e6dc]/70 gsap-bar-grow">
                  {step.equityPct > 0 && (
                    <div
                      style={{ width: `${step.equityPct}%` }}
                      className="bg-[#788c5d] text-xs font-mono text-white flex items-center justify-center"
                    >
                      {step.equityPct >= 10 ? `Equity ${step.equityPct}%` : ''}
                    </div>
                  )}
                  {step.hybridGoldPct > 0 && (
                    <div
                      style={{ width: `${step.hybridGoldPct}%` }}
                      className="bg-[#d97757] text-xs font-mono text-white flex items-center justify-center"
                    >
                      {step.hybridGoldPct >= 10 ? `Hybrid ${step.hybridGoldPct}%` : ''}
                    </div>
                  )}
                  {step.debtPct > 0 && (
                    <div
                      style={{ width: `${step.debtPct}%` }}
                      className="bg-[#6a9bcc] text-xs font-mono text-white flex items-center justify-center"
                    >
                      {step.debtPct >= 10 ? `Debt ${step.debtPct}%` : ''}
                    </div>
                  )}
                  {step.liquidPct > 0 && (
                    <div
                      style={{ width: `${step.liquidPct}%` }}
                      className="bg-[#141413] text-xs font-mono text-[#faf9f5] flex items-center justify-center"
                    >
                      {step.liquidPct >= 10 ? `Liquid ${step.liquidPct}%` : ''}
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#141413]/60">{step.rebalancingTrigger}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-8 mt-8 border-t border-[#e8e6dc] text-xs font-heading text-[#141413]/75">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#788c5d] inline-block" /> Equity
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#d97757] inline-block" /> Hybrid & Multi-Asset
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#6a9bcc] inline-block" /> Short & Corporate Debt
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#141413] inline-block" /> Liquid & Arbitrage
            </span>
          </div>
        </div>
      )}

      {/* 10-YEAR BACKTEST SECTION */}
      {(mode === 'BOTH' || mode === 'BACKTEST_ONLY') && (
        <div className="bg-white rounded-2xl border border-[#e8e6dc] p-8 sm:p-10 shadow-[0_2px_12px_rgba(20,20,19,0.03)]">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#e8e6dc]">
            <div>
              <h3 className="text-xl sm:text-2xl font-heading font-semibold text-[#141413] tracking-tight">
                10-Year Historical Backtest (2016–2025)
              </h3>
              <p className="text-sm text-[#141413]/65 mt-1 max-w-xl">
                Simulated growth of ₹10,00,000 across the recommended AMFI Direct-Plan mix compared against{' '}
                {bt.benchmarkName}.
              </p>
            </div>

            {/* Clean Typographic Metric Strip */}
            <div className="flex flex-wrap items-baseline gap-8">
              <div>
                <div className="text-xs font-heading text-[#141413]/55">10-Year CAGR</div>
                <div className="text-2xl sm:text-3xl font-heading font-semibold text-[#788c5d] mt-0.5">
                  {bt.portfolioCagr10YrPct}%
                </div>
                <div className="text-xs font-mono text-[#141413]/55">vs {bt.benchmarkCagr10YrPct}% benchmark</div>
              </div>

              <div>
                <div className="text-xs font-heading text-[#141413]/55">₹10L Grew To</div>
                <div className="text-2xl sm:text-3xl font-heading font-semibold text-[#141413] mt-0.5">
                  ₹{(bt.portfolioFinalValueInr / 100000).toFixed(2)}L
                </div>
                <div className="text-xs font-mono text-[#141413]/55">
                  vs ₹{(bt.benchmarkFinalValueInr / 100000).toFixed(2)}L benchmark
                </div>
              </div>

              <div>
                <div className="text-xs font-heading text-[#141413]/55">Max Drawdown</div>
                <div className="text-2xl sm:text-3xl font-heading font-semibold text-[#141413] mt-0.5">
                  {bt.maxDrawdownPct}%
                </div>
                <div className="text-xs font-mono text-[#788c5d]">vs {bt.benchmarkMaxDrawdownPct}% benchmark</div>
              </div>

              <div>
                <div className="text-xs font-heading text-[#141413]/55">Sharpe / Sortino</div>
                <div className="text-2xl sm:text-3xl font-heading font-semibold text-[#141413] mt-0.5">
                  {bt.sharpeRatio} / {bt.sortinoRatio}
                </div>
                <div className="text-xs font-mono text-[#141413]/55">
                  3Y Rolling Med: {bt.rolling3YrMedianPct}%
                </div>
              </div>
            </div>
          </div>

          {/* Spacious SVG Chart */}
          <div className="gsap-curve-fade mt-8">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-64 overflow-visible">
              <defs>
                <linearGradient id="portAreaGradSpacious" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#788c5d" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#788c5d" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
                const val = minVal + (1 - t) * (maxVal - minVal);
                const y = padT + t * (svgH - padT - padB);
                return (
                  <g key={idx}>
                    <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#e8e6dc" strokeDasharray="4 4" />
                    <text x={padL - 12} y={y + 4} textAnchor="end" className="text-[11px] fill-[#141413]/50 font-mono">
                      ₹{(val / 100000).toFixed(1)}L
                    </text>
                  </g>
                );
              })}

              <path d={areaPathD} fill="url(#portAreaGradSpacious)" />
              <path d={benchPathD} fill="none" stroke="#6a9bcc" strokeWidth="2" strokeDasharray="6 5" />
              <path d={portPathD} fill="none" stroke="#788c5d" strokeWidth="3" />

              {portPoints.map((pt, idx) => (
                <g
                  key={pt.year}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredYearIdx(idx > 0 ? idx - 1 : 0)}
                  onMouseLeave={() => setHoveredYearIdx(null)}
                >
                  <circle cx={pt.x} cy={pt.y} r={5} fill="#788c5d" stroke="#ffffff" strokeWidth="2" />
                  <text
                    x={pt.x}
                    y={svgH - 10}
                    textAnchor="middle"
                    className="text-[11px] fill-[#141413]/70 font-mono"
                  >
                    {pt.year}
                  </text>
                </g>
              ))}
            </svg>

            <div className="mt-6 pt-5 border-t border-[#e8e6dc] flex flex-wrap items-center justify-between gap-4 text-xs">
              {hoveredYearIdx !== null && series[hoveredYearIdx] ? (
                <div className="font-mono text-[#141413] flex flex-wrap items-center gap-6">
                  <span className="font-bold text-[#d97757] text-sm">{series[hoveredYearIdx].year}</span>
                  <span>Portfolio: <strong>{series[hoveredYearIdx].portfolioReturnPct}%</strong></span>
                  <span>Benchmark: <strong>{series[hoveredYearIdx].benchmarkReturnPct}%</strong></span>
                  <span>Drawdown: <strong>{series[hoveredYearIdx].portfolioDrawdownPct}%</strong></span>
                  <span className="text-[#141413]/60">{series[hoveredYearIdx].marketRegimeNote}</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-6 font-heading text-[#141413]/70">
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-[#788c5d] inline-block" /> Recommended Direct-Plan Mix
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-[#6a9bcc] inline-block" /> {bt.benchmarkName}
                  </span>
                  <span className="text-[#141413]/45">Hover any year on the curve to inspect annual performance</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
