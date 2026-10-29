# ArthaGuard AI — SEBI RIA Co-Pilot Implementation Plan

## Goal
Build and verify **ArthaGuard AI**, a production-ready SEBI-registered Investment Adviser (RIA) co-pilot for Zeckathon Problem Statement 04 that profiles clients (Risk Capacity vs. Risk Tolerance), builds inflation-adjusted goal plans with glide paths, constructs AMFI Direct-Plan portfolios with 10-year historical backtests, answers fund research questions via page-cited RAG, and enforces SEBI suitability guardrails with mandatory Human-in-the-Loop RIA approval.

## Tasks
- [x] Task 1: Lock in all 8 architectural, PRD, SDLC, schema, auth, and system design docs in `docs/` + `.env.example` + `CHECKLIST.md` → Verify: All 8 files exist in `docs/` and `.env.example` is in root.
- [x] Task 2: Initialize `backend/` (Express + TypeScript), Dual-Mode MongoDB/Vector/Redis adapters, Render 10-min Keep-Alive daemon, and Single-Provider AI Gateway (Gemini Primary + Groq Fallback) → Verify: `GET /api/v1/health` and `/api/v1/health/keep-alive` return 200 OK.
- [x] Task 3: Seed AMFI Direct-Plan schemes (with 10-yr NAV/return vectors), SID/Factsheet page-indexed RAG corpus, 6 Zeckathon PS 04 personas, 25 fund benchmark questions, and 10 adversarial prompts → Verify: `/api/v1/personas`, `/api/v1/funds`, and `/api/v1/rag/documents` return complete seeded records.
- [x] Task 4: Implement Quantitative Engines (`riskEngine.ts`, `goalPlanner.ts`, `portfolioBuilder.ts`), Hybrid Page-Cited `ragEngine.ts`, and `guardrailEngine.ts` + Cryptographic RIA Approval workflow → Verify: `POST /api/v1/plans/generate` and `POST /api/v1/plans/:id/approve` succeed for all 6 personas.
- [x] Task 5: Build `frontend/` (React + Vite + Tailwind + GSAP `@gsap/react`) with Anthropic Brand Styling (`#141413`, `#faf9f5`, `#d97757`, `#6a9bcc`, `#788c5d`, `Poppins` + `Lora`) covering all 5 deliverables → Verify: `npm run build` succeeds with zero TypeScript/bundle errors.
- [x] Task 6: Run automated QA test suite (6 personas, 25 cited fund QA questions, 10 adversarial prompts) and live E2E server verification, then generate reproducible `SUBMISSION_REPORT.md` and `README.md` → Verify: 100% QA pass rate (`25/25` RAG, `10/10` Guardrails).

## Done When
- [x] All 5 PS 04 deliverables, 6 personas, 25 cited RAG questions, 10 adversarial guardrail prompts, Render keep-alive daemon, and Single-Provider AI Layer are live, verified, and 100% reproducible.
