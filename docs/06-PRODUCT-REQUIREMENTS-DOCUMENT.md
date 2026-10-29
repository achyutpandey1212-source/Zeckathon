# 06 — Product Requirements Document (PRD) (Locked-In)

**Product Name:** ArthaGuard AI — Fiduciary Co-Pilot for SEBI-Registered Investment Advisers  
**Track:** Zeckathon Problem Statement 04 (AI Advisory • Suitability • Human-in-the-Loop)  
**Target Scale:** Enable 1 SEBI RIA to safely profile, plan, research, and supervise **1,000+ clients**  
**Status:** Locked for Implementation  

---

## 1. Problem Statement & Opportunity

India has over **160 million mutual fund folios** and hundreds of millions of retail investors, yet fewer than **1,000 active SEBI-registered Investment Advisers (RIAs)**.
- **Why RIAs cannot scale today:** Comprehensive risk profiling, multi-goal inflation modelling, screening AMFI direct-plan schemes, verifying SIDs/factsheets, and writing compliance documentation takes **4 to 6 hours per client**.
- **Why generic AI chatbots fail:** Generic LLMs hallucinate NAVs/returns, omit page citations, ignore the distinction between *risk capacity* and *risk tolerance*, and comply with dangerous client requests (e.g., recommending 100% small-cap funds to a 68-year-old retiree or promising 20% guaranteed returns).
- **The ArthaGuard Solution:** A deterministic-math + grounded-RAG AI Co-Pilot that automates **85%+ of the research and planning workflow in under 15 seconds**, while keeping the registered human adviser in mandatory control of every client-facing output.

---

## 2. Target Personas & Mandatory Test Cases (PS 04)

Our product ships with all **6 Mandatory Zeckathon Test Personas** pre-configured for instant 1-click evaluation, plus a Custom Persona Builder:

| ID | Persona & City | Age | Financial Situation | Goal / Suitability Test Case | Expected Co-Pilot Behaviour |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **P1** | **Fresh Graduate, Bengaluru** | 23 | ₹55k/month take-home; no dependants; minimal savings | Emergency fund first, then long-term wealth creation | Prioritizes 6-month Liquid/Overnight Emergency Fund before initiating long-horizon Flexi-Cap + Nifty 50 Index SIP with 10% annual step-up. |
| **P2** | **Young Couple, Pune** | 31 | Dual income (₹1.65L/mo combined); active home-loan EMI (₹42k/mo) | Child's higher education in 15 years | Accounts for EMI debt burden in Risk Capacity; models 8.5% education inflation; constructs 15-year Glide Path de-risking at years 10, 12, and 14. |
| **P3** | **Small Business Owner, Surat** | 44 | Irregular business income; high idle cash holdings (₹35L in savings/current account) | Retirement at age 58 (14-year horizon) | Penalizes Risk Capacity for income irregularity; carves out 12-month business buffer; deploys excess idle cash via staggered STP + core Hybrid/Flexi-Cap mix. |
| **P4** | **Doctor, Patna** | 38 | High income (₹3.2L/mo); heavily under-invested (mostly FDs/cash); behaviourally risk-averse | Retirement at 60 + Parents' medical corpus in 5 years | Resolves conflict between **High Risk Capacity ($RC=84$)** and **Low Risk Tolerance ($RT=32$)**; isolates short-term Conservative Debt/Arbitrage bucket for parents' medical corpus (9.5% healthcare inflation) while educating & using Balanced Advantage / Low-Volatility Large Cap for retirement. |
| **P5** | **Retiree, Chennai** | 68 | ₹80 lakh retirement corpus + ₹25k/mo pension; requests high equity / small-cap growth | Monthly inflation-adjusted income (SWP) for 25 years | **Hard Suitability Override:** Blocks any high-risk / small-cap request; enforces Conservative Bucket Strategy (Liquid/Short-Duration Debt for Years 1–5 SWP + Conservative Hybrid/Balanced Advantage for inflation protection). |
| **P6** | **Aggressive Trader, Mumbai** | 29 | F&O losses (₹6.5L lost); credit/cash strain; demands *"high returns fast"* (25–30% p.a.) | Co-pilot must enforce suitability & behavioural guardrails | **Critical Guardrail Trigger:** Refuses return guarantees & speculative small-cap/sectoral bets; resolves high stated Risk Tolerance ($RT=95$) down to constrained Risk Capacity ($RC=42$); enforces F&O cooling-off, emergency reserve, and disciplined diversified direct plans. |

---

## 3. Functional Requirements Matrix

| Req ID | Deliverable | Requirement Specification | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **FR-01** | **01 Risk Profiling** | Compute independent `Risk Capacity` (0–100) and `Risk Tolerance` (0–100) scores with transparent sub-factor weights. | Both scores, sub-factor bars, and exact mathematical formula are visible in the UI. |
| **FR-02** | **01 Risk Profiling** | Resolve conflicts between Capacity and Tolerance via a deterministic, transparent rule (`ERS`). | Conflict banner displays whenever $|RC - RT| \ge 20$ or tiers diverge, showing exact rule applied. |
| **FR-03** | **02 Goal-Based Plan** | Compute inflation-adjusted Future Corpus, Monthly SIP, Step-Up SIP, and Lump-Sum deployment per goal. | Uses RBI DBIE inflation rates (6% CPI, 8.5% Education, 9.5% Medical) and matches exact FV/SIP formulas. |
| **FR-04** | **02 Goal-Based Plan** | Generate a multi-stage Glide Path schedule showing progressive equity-to-debt de-risking as each goal approaches. | Interactive chart and year-by-year table show transition at 5Y, 3Y, and 1Y remaining. |
| **FR-05** | **03 Portfolio Construction** | Shortlist AMFI Direct-Plan mutual funds using TER, Tracking Error, 3Y/5Y Rolling Returns, Max Drawdown, AUM, and Manager Tenure. | Every recommended scheme is a Direct-Plan Growth fund with full stated selection metrics and SID/Factsheet citation. |
| **FR-06** | **03 Portfolio Construction** | Execute a 10-year historical backtest (2016–2026) of the recommended portfolio mix against benchmark. | Displays 10Y CAGR, Alpha, Max Drawdown, Volatility, Sharpe, Sortino, and interactive 2016–2026 wealth curve. |
| **FR-07** | **04 Research Assistant** | RAG engine over Fund Factsheets, SIDs, and Portfolio Disclosures linking **every factual claim to its exact source document and page number**. | Inline clickable citation pills `[Doc, p. X]` open the verbatim source page excerpt viewer; 25-question benchmark suite scores 100% cited accuracy. |
| **FR-08** | **05 Guardrails & HITL** | Never guarantee returns; flag unsuitable requests; disclose conflicts of interest; require RIA approval before client output. | 10 adversarial prompts (e.g. "guarantee me 20%") are 100% blocked with SEBI IA Reg citations; Client export is locked until RIA signs off. |

---

## 4. Non-Functional Requirements (NFRs)

- **NFR-01 (Reproducibility):** Every single number in the UI, API, and submission report is 100% reproducible via deterministic seeds and verifiable formulas (`npm run verify` / `/api/v1/audit/reproducibility-report`).
- **NFR-02 (Latency):** Full persona-to-plan generation completes in `< 2.5 seconds` (with AI narrative) or `< 50 ms` (deterministic quant mode), maximizing the "Adviser Time Saved" judging score.
- **NFR-03 (High Availability on Free Infra):** Zero cold-start downtime via the 10-minute Render Keep-Alive self-ping scheduler + dual-provider AI gateway (`Gemini` $\rightarrow$ `Groq` $\rightarrow$ `Deterministic`).
