# 08 — Tech Stack & Master Implementation Plan (Locked-In)

**Project:** ArthaGuard AI — SEBI-Registered Investment Adviser (RIA) Co-Pilot (Zeckathon PS 04)  
**Version:** 1.0.0 (Locked)  
**Date:** October 29, 2026  

---

## 1. Locked-In Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + TypeScript + Vite 6** | Sub-second HMR, strict type safety, zero SSR hydration issues with GSAP, instant static deploy on Vercel/Render. |
| **Styling & Brand System** | **Tailwind CSS v3/v4 + Anthropic Brand Tokens (`Poppins` + `Lora`)** | Implements Anthropic official palette (`#141413`, `#faf9f5`, `#d97757`, `#6a9bcc`, `#788c5d`) and bespoke editorial wealth-management layout (`frontend-design` skill). |
| **Animation Engine** | **GSAP 3 + `@gsap/react` (`useGSAP`, `gsap.matchMedia`)** | Scoped, accessible (`prefers-reduced-motion` aware) animations for risk gauges, 10-year backtest SVG curves, glide paths, and RIA approval stamps. |
| **Icons & Data Viz** | **Lucide React + Custom Interactive SVG Financial Charts** | Zero-bloat, crisp vector charts for 10-year wealth backtests, drawdown curves, and glide-path stacked bars. |
| **Backend Runtime** | **Node.js v22 + Express 4 + TypeScript** | Non-blocking I/O, fast quantitative execution (`< 10ms`), unified monorepo TypeScript types. |
| **Database & Vector DB** | **MongoDB (`mongodb` / `mongoose`) + Atlas Vector Search + Automatic In-Memory/JSON Fallback** | Native document + 768-dim cosine vector search on MongoDB Atlas M0 free tier, with zero-config local execution fallback. |
| **Caching & Rate Limit** | **Redis (`ioredis` / Upstash compatible) + In-Memory LRU Fallback** | Protects free-tier AI quotas and serves repeated persona/RAG queries in `< 2ms`. |
| **Single-Provider AI Layer** | **Google Gemini (`@google/genai` Primary) + Groq (`groq-sdk` / REST Fallback)** | Opaque `AIProviderGateway` with automatic circuit-breaker failover and grounded deterministic safety net. |
| **Auth & Security** | **JWT (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors`, `compression`** | Stateless RBAC (`RIA_ADVISER`, `COMPLIANCE_OFFICER`, `DEMO_JUDGE`), cryptographic SHA-256 plan approval seals. |

---

## 2. Step-by-Step Implementation Plan

### Step 1: Project Initialization & Environment Configuration
- Create root `.env.example`, `.gitignore`, and workspace structure (`backend/`, `frontend/`, `docs/`, `CHECKLIST.md`).
- Configure `backend/package.json` and `frontend/package.json` with clean scripts (`dev`, `build`, `start`, `test:qa`).

### Step 2: Backend Core, Dual-Mode DB/Vector/Redis & Single-Provider AI Gateway
- Implement `backend/src/config/env.ts`, `db.ts` (MongoDB Atlas + automatic local JSON/memory fallback), and `redis.ts` (Redis + LRU memory fallback).
- Implement `backend/src/services/ai/aiGateway.ts` encapsulating `gemini.provider.ts` (Primary) and `groq.provider.ts` (Fallback) behind a single provider-agnostic interface.
- Implement `backend/src/services/keepAlive/keepAlive.service.ts` to ping `RENDER_EXTERNAL_URL/api/v1/health/keep-alive` every 10 minutes.

### Step 3: Curated Financial Data Seeds (AMFI, SIDs/Factsheets, RBI DBIE, 6 Personas)
- Build `amfiFunds.seed.ts`: 14 real-world inspired AMFI Direct-Plan Growth schemes with 10-year (2016–2026) yearly NAV/return trajectories, TER, AUM, Tracking Error, 3Y/5Y Rolling Returns, Max Drawdown, and Manager Tenure.
- Build `ragDocuments.seed.ts`: 30+ high-density, page-numbered factual chunks from Fund Factsheets, SIDs, Portfolio Disclosures, SEBI IA Regulations 2013/2020, and RBI DBIE inflation reports, pre-indexed with vector embeddings and structured facts.
- Build `personas.seed.ts`: All 6 official Zeckathon PS 04 personas with complete financial balance sheets, behavioural profiles, and multi-goal specifications.
- Build `adversarialPrompts.seed.ts`: 10 adversarial prompts + 25 hidden-style fund factual benchmark questions.

### Step 4: Quantitative Engines, RAG Pipeline, Guardrails & HITL Approval API
- Implement `riskEngine.ts` (Deliverable 01), `goalPlanner.ts` (Deliverable 02), `portfolioBuilder.ts` (Deliverable 03), `ragEngine.ts` (Deliverable 04), and `guardrailEngine.ts` (Deliverable 05).
- Expose all REST routes (`/api/v1/health`, `/auth`, `/personas`, `/plans`, `/funds`, `/rag`, `/guardrails`, `/audit`) and mount in `app.ts`.

### Step 5: Frontend Application (Anthropic Brand + Frontend Design + GSAP)
- Build the complete React + TypeScript + Tailwind + GSAP UI in `frontend/src/`:
  - **Top Fiduciary Telemetry Bar:** SEBI RIA Badge (`INA000018492`), Live Workflow Timer ("1,000-Client Scale Mode"), Render Keep-Alive Status, and Role/Persona Quick Switcher.
  - **Tab 1 — Co-Pilot Plan Workbench (Deliverables 01, 02, 03, 05):**
    - Persona Selector Cards (all 6 PS 04 Personas + "New Custom Client").
    - Risk Capacity vs. Risk Tolerance Split Studio + Conflict Resolution Rule Banner.
    - Goal-Based Financial Plan Table (RBI Inflation-Adjusted Corpus, Monthly SIP, Step-Up SIP, Lump Sum) + Interactive Glide Path Visualizer.
    - AMFI Direct-Plan Portfolio Shortlist Table (TER, Rolling Returns, Tracking Error, Drawdown, AUM, Tenure, Page Citations) + Interactive 10-Year Historical Backtest Chart (2016–2026 vs Nifty 50 TRI).
    - Mandatory SEBI RIA Approval & Override Drawer (with SHA-256 Digital Seal & Client Report Unlock).
  - **Tab 2 — Cited Research Assistant & 25-Question Benchmark (Deliverable 04):**
    - RAG Q&A Console with clickable `[Document, Page X]` citation badges, Side-by-Side Source Document Page Reader, and 1-Click 25-Question Factual Accuracy Benchmark Runner.
  - **Tab 3 — Guardrail Stress-Test Lab (Deliverable 05):**
    - Live Adversarial Prompt Tester + 1-Click 10-Adversarial Judge Prompt Suite Runner + SEBI IA Regulation 2013 Compliance Matrix.
  - **Tab 4 — Printable Client Report & Hackathon Submission Deck View:**
    - Executive Client Proposal (unlocked after RIA approval) + Reproducible Numbers Audit Table.

### Step 6: Rigorous Automated QA, Browser Verification (`/browser`), and Final Cleanup
- Run backend & frontend build checks (`tsc --noEmit`, `npm run build`).
- Execute automated QA verification suite (`qa-test.ts`) across all 6 personas, 25 fund questions, and 10 adversarial prompts.
- Launch `browser` subagent to visually inspect, click through, and verify all features in the live browser.
- Update `CHECKLIST.md` to 100% completion and generate `SUBMISSION_REPORT.md` + `README.md`.
