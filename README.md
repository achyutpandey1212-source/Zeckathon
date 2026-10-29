# ArthaGuard AI — SEBI-Registered Investment Adviser (RIA) Co-Pilot

> **Zeckathon Problem Statement 04:** *A Co-Pilot That Lets One Adviser Serve 1,000 Clients Safely*  
> **Track:** AI Advisory • Suitability • Human-in-the-Loop

---

## 1. Overview

**ArthaGuard AI** is a full-stack fiduciary co-pilot built for SEBI-Registered Investment Advisers (RIAs). It automates **85%+ of client risk profiling, goal-based financial planning, AMFI Direct-Plan portfolio construction, 10-year historical backtesting, and page-cited SID/Factsheet research**—while enforcing **SEBI (Investment Advisers) Regulations, 2013** guardrails and keeping the human adviser in mandatory control of every client-facing recommendation.

### Key Highlights
- **Deliverable 01 (Dual-Axis Risk Profiling):** Separates objective **Risk Capacity ($RC$)** from subjective **Risk Tolerance ($RT$)** and resolves conflicts via a transparent mathematical formula ($ERS = \min(RC, RT)$ for capacity-constrained or senior profiles; $0.65 RT + 0.35 RC$ inflation-bridge for high-capacity/FD-only profiles).
- **Deliverable 02 (Goal-Based Plan & Glide Path):** Computes RBI DBIE inflation-adjusted Future Corpus (6.0% Headline CPI, 8.5% Education, 9.5% Medical), flat & 10% Step-Up SIPs, 3-Bucket Retiree SWP plans, and multi-stage Glide Paths that progressively de-risk into Short-Term Debt & Liquid funds at 5Y, 3Y, and 1Y before goal maturity.
- **Deliverable 03 (AMFI Direct-Plan Portfolio & 10-Year Backtest):** Screens exclusively **Direct Plan - Growth** schemes (0.00% commission) using TER, Tracking Error, 3Y/5Y Rolling Returns, Max Drawdown, AUM, and Manager Tenure, accompanied by an interactive **2016–2025 10-Year Historical Backtest**.
- **Deliverable 04 (Page-Cited RAG Research Assistant):** Hybrid Vector + BM25 + Entity retrieval over AMC Factsheets, SIDs, Portfolio Disclosures, SEBI IA Regulations, and RBI DBIE bulletins. Every factual claim links to its exact `[Document Title, p. X]` page. Achieves **25/25 (100%)** on the factual benchmark with **0 invented figures**.
- **Deliverable 05 (SEBI Guardrails & Mandatory Human-in-the-Loop Gate):** Blocks return guarantees (*"guarantee me 20%"*), blocks unsuitable requests (*68-year-old asking for 100% small-cap*, *F&O trader chasing losses*), discloses zero-commission Direct-Plan fiduciary status, and locks client export until the SEBI RIA signs off with a **SHA-256 cryptographic seal**.
- **Opaque Single-Provider AI Layer (`Gemini Primary` $\rightarrow$ `Groq Fallback`):** All AI calls route through `AIProviderGateway` (`backend/src/services/ai/aiGateway.ts`). Domain services never know whether Gemini or Groq answered.
- **Render 15-Minute Cooldown Keep-Alive Daemon:** Built-in `KeepAliveService` pings `/api/v1/health/keep-alive` every 10 minutes so free-tier Render deployments never spin down.

---

## 2. Complete Architecture & Product Documentation (`docs/`)

All locked-in design and product management documents are located in [`docs/`](./docs):
1. [`docs/01-BACKEND-SPECIFICATION.md`](./docs/01-BACKEND-SPECIFICATION.md) — Backend API contracts, quant formulas & keep-alive spec
2. [`docs/02-DATABASE-SCHEMA-DESIGN.md`](./docs/02-DATABASE-SCHEMA-DESIGN.md) — MongoDB collections, indexes & Atlas Vector Search schema
3. [`docs/03-AUTH-AND-SECURITY-SPEC.md`](./docs/03-AUTH-AND-SECURITY-SPEC.md) — JWT RBAC, SEBI RIA session & SHA-256 plan approval seal
4. [`docs/04-SYSTEM-DESIGN.md`](./docs/04-SYSTEM-DESIGN.md) — Free-tier high concurrency, caching & Render spin-down prevention
5. [`docs/05-SYSTEM-ARCHITECTURE.md`](./docs/05-SYSTEM-ARCHITECTURE.md) — Single-Provider AI Gateway & HITL state machine diagrams
6. [`docs/06-PRODUCT-REQUIREMENTS-DOCUMENT.md`](./docs/06-PRODUCT-REQUIREMENTS-DOCUMENT.md) — Full PRD & 6 Zeckathon Persona specifications
7. [`docs/07-SDLC-PRODUCT-MANAGEMENT.md`](./docs/07-SDLC-PRODUCT-MANAGEMENT.md) — SDLC execution plan, risk register & QA matrix
8. [`docs/08-TECH-STACK-AND-IMPLEMENTATION-PLAN.md`](./docs/08-TECH-STACK-AND-IMPLEMENTATION-PLAN.md) — Locked tech stack & implementation blueprint
9. [`SUBMISSION_REPORT.md`](./SUBMISSION_REPORT.md) — Official reproducible report & 6-persona answer key

---

## 3. Quick Start (Local Setup in < 2 Minutes)

### Prerequisites
- **Node.js** v20+ (tested on v22.23.2) and **npm** v10+

### 1. Environment Configuration
Copy `.env.example` to `.env` in the root and `backend/.env`:
```bash
cp .env.example .env
cp .env.example backend/.env
```
> **Zero-Config Evaluation Mode:** If `MONGODB_URI` or `REDIS_URL` are left as placeholders, ArthaGuard automatically boots in **Local Persistence + In-Memory Vector Mode** with all 6 Zeckathon personas, 11 AMFI Direct-Plan schemes, 14 SID/Factsheet pages, 25 benchmark questions, and 10 adversarial prompts pre-seeded! When you enrich `.env` with your live MongoDB Atlas URI, Upstash Redis URL, `GEMINI_API_KEY`, and `GROQ_API_KEY`, it automatically connects to them.

### 2. Install & Run Backend (Port 5000)
```bash
cd backend
npm install
npm run test:qa   # Runs automated QA & reproduces every number in SUBMISSION_REPORT.md
npm run dev       # Starts backend on http://localhost:5000
```

### 3. Install & Run Frontend (Port 5173)
Open a second terminal:
```bash
cd frontend
npm install
npm run dev       # Starts UI on http://localhost:5173
```

---

## 4. Reproducing All Report Numbers (`npm run test:qa`)

Run the automated verification suite at any time:
```bash
cd backend
npm run test:qa
```
Or query the live JSON reproducibility endpoint:
```bash
curl http://localhost:5000/api/v1/audit/reproducibility-report
```

---

## 5. Free-Tier Deployment Guide (Render + Vercel) & Zetheta Submission

### Deploying Backend to Render (Web Service — Free Tier)
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`
- **Environment Variables:** Copy keys from `.env.example` (`GEMINI_API_KEY`, `GROQ_API_KEY`, `MONGODB_URI`, `REDIS_URL`, `ENABLE_KEEP_ALIVE=true`, `RENDER_EXTERNAL_URL=https://<your-service>.onrender.com`).

### Deploying Frontend to Vercel / Render Static Site
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_BASE_URL=https://<your-backend-service>.onrender.com/api/v1`

### Zeckathon Submission & Repository Transfer Checklist
1. Submit [`SUBMISSION_REPORT.md`](./SUBMISSION_REPORT.md) (or print the **Client Report Gate & 6-Persona Answer Key** tab directly to a selectable-text PDF via the **Print / Save Selectable PDF** button in the app).
2. Submit both on the **Zeckathon Google Form** and **zeckathon.com**.
3. Transfer GitHub repository ownership to user ID **`ZethetaIntern`** and inform Zetheta of the originating GitHub user ID and team email address.
