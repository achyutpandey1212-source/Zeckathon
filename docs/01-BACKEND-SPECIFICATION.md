# 01 — Backend Specification Document (Locked-In)

**Project:** ArthaGuard AI — SEBI-Registered Investment Adviser (RIA) Co-Pilot (Zeckathon PS 04)  
**Version:** 1.0.0 (Locked)  
**Date:** October 29, 2026  

---

## 1. Executive Overview & Core Architecture Principles

The ArthaGuard backend is a high-concurrency, deterministic-first, AI-augmented REST service built on **Node.js (v22+) + Express + TypeScript**. It is engineered specifically to satisfy the five mandatory deliverables of **Zeckathon Problem Statement 04**:

1. **Zero Hallucinated Financial Math:** Every financial calculation (Risk Capacity vs. Tolerance scoring, inflation-adjusted Future Value corpus, regular & step-up SIP formulas, Glide Path de-risking schedules, and 10-year historical portfolio backtesting with CAGR, Max Drawdown, Rolling Returns, and Sortino/Sharpe ratios) is executed in a **100% deterministic quantitative engine (`src/services/quant/`)**. LLMs are **never** used to compute numbers.
2. **Opaque Dual-Provider AI Layer (`Gemini Primary` + `Groq Fallback`):** All AI capabilities (advisory rationale synthesis, natural language risk conflict explanation, RAG grounded Q&A synthesis, and semantic guardrail classification) route through a single `AIProviderGateway` (`src/services/ai/aiGateway.ts`). Calling modules have zero knowledge of whether Google Gemini (`gemini-2.5-flash`) or Groq (`llama-3.3-70b-versatile`) fulfilled the request.
3. **Verifiable Page-Level RAG Citations:** Every factual claim about a mutual fund scheme is grounded in a curated corpus of AMFI scheme master records, AMC Fund Factsheets, Scheme Information Documents (SIDs), and Monthly Portfolio Disclosures. Claims without a valid `[Document Title, Page X]` citation are rejected or flagged with negative-score prevention rules.
4. **Multi-Layer SEBI Suitability & Adversarial Guardrails:** Every incoming prompt and outgoing recommendation passes through a 3-stage compliance pipeline (Deterministic Regex/Rule Filter → Quantitative Suitability Validator → AI Semantic Compliance Classifier) enforcing **SEBI (Investment Advisers) Regulations, 2013 (amended 2020)**.
5. **Mandatory Human-in-the-Loop (HITL) Approval State Machine:** No recommendation or plan can be exported or viewed in Client Mode until an authenticated SEBI-registered Investment Adviser explicitly reviews, optionally overrides with documented rationale, and cryptographically signs off on the plan.
6. **Free-Tier High Concurrency & Render 15-Minute Cooldown Prevention:** Includes a dedicated `KeepAliveService` daemon that pings the server's own health endpoint every 10 minutes (`600,000 ms`), combined with an external cron webhook endpoint, in-memory/Redis caching, and dual-mode database persistence (MongoDB Atlas + automatic local JSON/memory fallback).

---

## 2. Directory Structure (`backend/`)

```text
backend/
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts                        # Server bootstrap, graceful shutdown, KeepAlive startup
│   ├── app.ts                          # Express app, CORS, compression, security headers, rate-limiters
│   ├── config/
│   │   ├── env.ts                      # Validated environment variables & defaults
│   │   ├── db.ts                       # Dual-mode MongoDB Atlas + Local Fallback persistence engine
│   │   └── redis.ts                    # Dual-mode Upstash Redis + In-Memory LRU cache adapter
│   ├── data/
│   │   ├── personas.seed.ts            # Exact 6 Zeckathon PS 04 test personas with ground-truth baselines
│   │   ├── amfiFunds.seed.ts           # Direct-plan AMFI mutual fund universe + 10-yr monthly/yearly NAV series
│   │   ├── ragDocuments.seed.ts        # Verifiable SIDs, Factsheets & Portfolio Disclosures with exact page numbers
│   │   ├── rbiMacro.seed.ts            # RBI DBIE CPI inflation, education/medical inflation & repo rate series
│   │   └── adversarialPrompts.seed.ts  # 10 Judge adversarial prompts + 25 Hidden-style Fund QA benchmark suite
│   ├── models/
│   │   ├── User.model.ts               # RIA Advisers, Compliance Officers, Demo Judges
│   │   ├── ClientPersona.model.ts      # Client profiles, financials, goals, risk questionnaires
│   │   ├── FinancialPlan.model.ts      # Generated plans, quant outputs, backtests, HITL approval state
│   │   ├── FundScheme.model.ts         # AMFI Direct-Plan schemes & 10-yr historical return vectors
│   │   ├── RagChunk.model.ts           # Page-indexed document chunks + vector embeddings
│   │   └── AuditLog.model.ts           # Immutable compliance & adviser approval trail
│   ├── middleware/
│   │   ├── auth.middleware.ts          # JWT verification, RBAC role guards, Demo Judge auto-session
│   │   ├── rateLimit.middleware.ts     # Tiered rate limiting (Public, Auth, AI/RAG endpoints)
│   │   └── errorHandler.middleware.ts  # Standardized RFC 7807 JSON error responses
│   ├── services/
│   │   ├── ai/
│   │   │   ├── aiGateway.ts            # Single-Provider abstraction (Gemini Primary -> Groq Fallback -> Deterministic)
│   │   │   ├── gemini.provider.ts      # Google GenAI SDK integration
│   │   │   └── groq.provider.ts        # Groq REST/SDK integration
│   │   ├── quant/
│   │   │   ├── riskEngine.ts           # Deliverable 01: Risk Capacity vs Risk Tolerance & Conflict Resolution Rule
│   │   │   ├── goalPlanner.ts          # Deliverable 02: Inflation-adjusted Corpus, SIP, Asset Allocation & Glide Path
│   │   │   ├── portfolioBuilder.ts     # Deliverable 03: AMFI Direct-Plan screening + 10-Year Historical Backtest
│   │   ├── rag/
│   │   │   └── ragEngine.ts            # Deliverable 04: Hybrid Vector + Keyword Retrieval with mandatory Page Citations
│   │   ├── guardrails/
│   │   │   └── guardrailEngine.ts      # Deliverable 05: SEBI IA Reg 2013 Guardrails, Anti-Guarantee & Suitability Flags
│   │   └── keepAlive/
│   │       └── keepAlive.service.ts    # Render 15-min spin-down prevention self-ping scheduler
│   └── routes/
│       ├── health.routes.ts            # /api/v1/health, /api/v1/health/keep-alive, /api/v1/health/telemetry
│       ├── auth.routes.ts              # /api/v1/auth/login, /register, /demo-session, /me
│       ├── personas.routes.ts          # /api/v1/personas (CRUD + 6 PS04 presets + reset)
│       ├── plans.routes.ts             # /api/v1/plans/generate, /:id, /:id/approve, /:id/override
│       ├── funds.routes.ts             # /api/v1/funds, /shortlist, /backtest
│       ├── rag.routes.ts               # /api/v1/rag/query, /documents, /benchmark-25
│       ├── guardrails.routes.ts        # /api/v1/guardrails/validate, /adversarial-suite
│       └── audit.routes.ts             # /api/v1/audit/logs, /reproducibility-report
```

---

## 3. Core Quantitative Engine Specifications (Deliverables 01, 02, 03)

### 3.1 Deliverable 01: Risk Profiling & Conflict Resolution Engine (`riskEngine.ts`)

We strictly separate **Risk Capacity** (objective financial ability to absorb loss) from **Risk Tolerance** (subjective behavioural willingness to accept volatility).

#### A. Risk Capacity Score ($RC \in [0, 100]$)
Computed from 5 objective financial dimensions:
1. **Horizon Factor ($W = 25\%$):**
   - $< 3$ yrs: $15$, $3\text{–}5$ yrs: $40$, $5\text{–}10$ yrs: $70$, $> 10$ yrs: $95$.
   - Age penalty: If $\text{Age} \ge 60$, cap Horizon score at $35$.
2. **Liquidity & Emergency Reserve Factor ($W = 20\%$):**
   - Months of expenses covered by liquid cash/FD: $< 3$ mos: $10$, $3\text{–}6$ mos: $60$, $> 6$ mos: $95$.
3. **Debt-to-Income / EMI Burden Factor ($W = 20\%$):**
   - $\text{EMI Ratio} = \frac{\text{Monthly Debt Service}}{\text{Monthly Take-Home Income}}$
   - $> 50\%$: $10$, $30\text{–}50\%$: $45$, $10\text{–}30\%$: $75$, $< 10\%$: $95$.
4. **Income Stability & Surplus Rate ($W = 20\%$):**
   - Salaried/Dual Income with $>30\%$ savings rate: $90$; Irregular/Business income: $55$; Retiree/Pension-only: $25$; Unstable/Speculative F&O losses: $15$.
5. **Dependants & Liability Load ($W = 15\%$):**
   - $0$ dependants: $95$, $1\text{–}2$ dependants: $65$, $\ge 3$ dependants or immediate parent medical liability: $35$.

$$RC = \text{round}(0.25 H + 0.20 L + 0.20 D + 0.20 I + 0.15 P)$$

#### B. Risk Tolerance Score ($RT \in [0, 100]$)
Computed from 4 behavioural assessment dimensions:
1. **Drawdown Reaction ($W = 35\%$):** Sells immediately on 10% drop ($15$), holds nervously ($50$), holds calmly ($75$), buys more ($95$).
2. **Return vs. Safety Preference ($W = 25\%$):** Capital protection priority ($15$), balanced growth ($55$), aggressive wealth ($85$), speculative "high returns fast" ($98$).
3. **Past Market & Product Experience ($W = 20\%$):** FDs/Gold only ($20$), Mutual Funds ($65$), Direct Equity ($80$), F&O / Leveraged Trading with losses ($85$ raw tolerance, flagged for **Behavioural Loss-Chasing Bias**).
4. **Sleep-at-Night Volatility Comfort ($W = 20\%$):** Max acceptable annual drawdown $<5\%$ ($15$), $10\%$ ($50$), $20\%$ ($80$), $>30\%$ ($95$).

#### C. Transparent Conflict Resolution Rule (SEBI Fiduciary Prudence Rule)
Let $\Delta = |RC - RT|$. A **Risk Conflict** is triggered whenever $\Delta \ge 20$ points or when $RC$ and $RT$ map to different risk tiers:

$$\text{Effective Risk Score } (ERS) = \begin{cases} 
\min(RC, RT) & \text{if } RT > RC \quad \text{(Capacity-Constrained Cap: Cannot take risk you cannot afford)} \\
\text{round}(0.65 \cdot RT + 0.35 \cdot RC) & \text{if } RC > RT \text{ and } \text{Inflation Shortfall Risk exists} \\
\min(RC, RT) & \text{if } \text{Age} \ge 60 \text{ or Emergency Fund} < 3\text{ months}
\end{cases}$$

- **Behavioural Speculation Override:** If client exhibits F&O losses and demands "high returns fast" (e.g., Persona 6), `ERS` is capped at `RC` (Moderate), high-beta Small-Cap/Sectoral funds are blocked, and a mandatory 6-month Liquid/Arbitrage Emergency Foundation is enforced first.
- **Risk Tiers:**
  - `0–30`: **Conservative** (Max Equity: 20%)
  - `31–50`: **Moderately Conservative** (Max Equity: 40%)
  - `51–70`: **Moderate / Balanced** (Max Equity: 60%)
  - `71–85`: **Moderately Aggressive** (Max Equity: 75%)
  - `86–100`: **Aggressive** (Max Equity: 85%)

---

### 3.2 Deliverable 02: Goal-Based Planning & Glide Path Engine (`goalPlanner.ts`)

1. **Category-Specific RBI DBIE Inflation Assumptions ($i_{\text{goal}}$):**
   - General Living / Retirement Lifestyle CPI: `6.0% p.a.` (RBI DBIE long-term CPI mean)
   - Higher Education Inflation: `8.5% p.a.`
   - Healthcare / Parents' Medical Corpus Inflation: `9.5% p.a.`
   - Emergency Fund: `6.0% p.a.` (Target = 6 months of monthly expenses; 12 months for irregular business income like Persona 3).

2. **Future Value Required Corpus ($FV$):**
   $$FV = PV \times (1 + i_{\text{goal}})^n$$
   For Retirement Corpus (e.g., Persona 3, 4, 5), we use the **Inflation-Adjusted Annuity / SWP Present Value Formula** over retirement life expectancy ($T_{\text{retire}}$ years, default to age 85–93):
   $$r_{\text{real}} = \frac{1 + r_{\text{post-retire}}}{1 + i_{\text{cpi}}} - 1$$
   $$\text{Retirement Corpus at Retirement Age} = \text{Annual Expense at Retirement} \times \frac{1 - (1 + r_{\text{real}})^{-T_{\text{retire}}}}{r_{\text{real}}}$$

3. **Required Monthly SIP Calculation:**
   Given blended portfolio expected return $r_p$ (annualized) and monthly rate $r_m = (1 + r_p)^{1/12} - 1$, over $N = 12 \times n$ months, after accounting for future value of existing earmarked lump-sum $FV_{\text{lump}} = L_0 (1 + r_p)^n$:
   $$FV_{\text{net}} = \max(0, FV - FV_{\text{lump}})$$
   $$\text{SIP} = \frac{FV_{\text{net}} \cdot r_m}{\left((1 + r_m)^N - 1\right)(1 + r_m)}$$
   We also compute a **10% Annual Step-Up SIP** alternative for cash-flow constrained young earners.

4. **Deterministic Glide Path Schedule:**
   Every goal generates a year-by-year **Glide Path De-Risking Schedule** from Year $0$ to Year $n$:
   - **Years $> 5$ to Goal:** Target Strategic Allocation based on $ERS$ and goal horizon.
   - **5 Years Remaining:** Reduce Equity by $15\%$, shift to Short-Duration Debt / Conservative Hybrid.
   - **3 Years Remaining:** Cap Equity at $\le 30\%$, shift $70\%$ to Short-Duration Debt & Arbitrage.
   - **1 Year Remaining (Capital Preservation Lock):** $0\%\text{–}10\%$ Equity, $90\%\text{–}100\%$ Liquid / Ultra-Short Duration Debt to eliminate sequence-of-returns risk before goal drawdown.

---

### 3.3 Deliverable 03: AMFI Direct-Plan Portfolio Construction & 10-Year Backtest (`portfolioBuilder.ts`)

1. **Multi-Factor Quantitative Fund Scoring ($S_{\text{fund}} \in [0, 100]$):**
   Filters exclusively for **SEBI Direct-Plan Growth** schemes from the AMFI universe and ranks each fund within its SEBI category using stated criteria:
   - **Cost Efficiency ($25\%$):** Lower Total Expense Ratio (TER %) vs category ceiling.
   - **Rolling Return Consistency ($25\%$):** 3-Year and 5-Year Rolling CAGR & % of periods beating benchmark.
   - **Downside Protection ($20\%$):** Maximum Drawdown (%) & Sortino Ratio over 10-year window (including 2020 COVID crash & 2022 rate cycle).
   - **Tracking Error / Alpha Efficiency ($15\%$):** Low Tracking Error for Index funds; high Information Ratio for Active Flexi/Mid/Balanced funds.
   - **AUM & Manager Tenure ($15\%$):** Minimum AUM liquidity filter ($> \text{₹}2,000\text{ Cr}$) and Manager Tenure ($\ge 4\text{ years}$).

2. **10-Year Historical Backtest (2016–2026):**
   Computes the exact annual and cumulative wealth curve of a ₹10,00,000 initial investment (and/or recommended SIP) across the weighted portfolio mix from **2016 to 2026**, compared against **Nifty 50 TRI** and **CRISIL Hybrid 35+65 Aggressive Index**:
   - Portfolio 10Y CAGR (%)
   - Benchmark 10Y CAGR (%)
   - Maximum Drawdown (%) & Peak-to-Recovery months
   - Annualized Volatility ($\sigma$) & Sharpe Ratio (assuming $R_f = 6.5\%$ RBI 10Y G-Sec / T-Bill proxy)
   - Rolling 3Y Return (Min, Median, Max)

---

## 4. REST API Endpoints Specification

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | System status, DB mode, AI provider readiness, uptime |
| `GET` | `/api/v1/health/keep-alive` | Public | Lightweight Render keep-alive ping receiver & scheduler stats |
| `POST` | `/api/v1/auth/login` | Public | Authenticate RIA Adviser / Compliance Officer, returns JWT |
| `POST` | `/api/v1/auth/demo-session` | Public | Instant 1-click SEBI RIA Demo Session for Hackathon Judges |
| `GET` | `/api/v1/auth/me` | Bearer | Current logged-in RIA profile & SEBI Registration metadata |
| `GET` | `/api/v1/personas` | Bearer/Demo | List all 6 official Zeckathon PS 04 personas + custom clients |
| `POST` | `/api/v1/personas` | Bearer/Demo | Create a custom client persona for live judge testing |
| `POST` | `/api/v1/plans/generate` | Bearer/Demo | Execute full pipeline (Risk + Goal + AMFI Portfolio + 10Y Backtest + Guardrails + AI Co-Pilot Rationale) |
| `GET` | `/api/v1/plans/:planId` | Bearer/Demo | Retrieve complete generated plan with audit trail |
| `POST` | `/api/v1/plans/:planId/approve` | RIA Only | **HITL Gate:** Adviser approves/modifies/rejects plan with digital signature & SEBI Reg ID |
| `GET` | `/api/v1/funds` | Bearer/Demo | Browse AMFI Direct-Plan universe with stated filtering criteria |
| `POST` | `/api/v1/rag/query` | Bearer/Demo | Ask research question over SIDs/Factsheets with exact page citations |
| `GET` | `/api/v1/rag/documents` | Bearer/Demo | List indexed AMC Factsheets, SIDs, Portfolio Disclosures & pages |
| `POST` | `/api/v1/rag/benchmark-25` | Bearer/Demo | Run automated 25-question factual accuracy & citation verification suite |
| `POST` | `/api/v1/guardrails/validate` | Bearer/Demo | Test any prompt against SEBI suitability & anti-guarantee guardrails |
| `POST` | `/api/v1/guardrails/adversarial-suite` | Bearer/Demo | Run all 10 Judge adversarial prompts (e.g., "guarantee me 20%") |
| `GET` | `/api/v1/audit/logs` | Bearer/Demo | Immutable compliance & HITL approval audit log |
| `GET` | `/api/v1/audit/reproducibility-report` | Public | Outputs deterministic JSON/Markdown verifying every number in the report |

---

## 5. Single-Provider AI Layer Contract (`aiGateway.ts`)

```typescript
export interface AIGatewayRequest {
  taskType: 'PLAN_RATIONALE' | 'RAG_SYNTHESIS' | 'GUARDRAIL_CHECK' | 'CONFLICT_EXPLANATION';
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  responseFormat?: 'json' | 'text';
  deterministicFallback: () => string | Record<string, unknown>;
}

export interface AIGatewayResponse<T = string> {
  output: T;
  latencyMs: number;
  grounded: boolean;
}
```

- **Primary:** Google Gemini (`gemini-2.5-flash` / `gemini-2.0-flash`) via `GEMINI_API_KEY`.
- **Fallback 1:** Groq Cloud (`llama-3.3-70b-versatile`) via `GROQ_API_KEY` if Gemini returns HTTP 429/5xx, times out (`> 7500ms`), or key is missing.
- **Fallback 2 (Zero-Downtime Guarantee):** Verified Deterministic Financial Synthesis Generator using the exact quantitative outputs and page-indexed RAG chunks—ensuring 100% uptime even in offline or rate-limited environments.
