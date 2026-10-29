# 05 — System Architecture Document (Locked-In)

**Project:** ArthaGuard AI — SEBI-Registered Investment Adviser (RIA) Co-Pilot (Zeckathon PS 04)  
**Version:** 1.0.0 (Locked)  
**Date:** October 29, 2026  

---

## 1. End-to-End Macro System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer["Frontend Layer (React 19 + TypeScript + Vite + Tailwind + GSAP)"]
        UI_Workbench["RIA Adviser Workbench\n(Anthropic Brand Identity + Editorial Typography)"]
        UI_Risk["Deliverable 01: Risk Capacity vs Tolerance Studio"]
        UI_Goals["Deliverable 02: Inflation-Adjusted Goals & Glide Path Visualizer"]
        UI_Portfolio["Deliverable 03: AMFI Direct-Plan Screener & 10-Yr Backtest Lab"]
        UI_RAG["Deliverable 04: Cited SID / Factsheet Research Co-Pilot"]
        UI_Guard["Deliverable 05: Adversarial Guardrail & HITL Sign-Off Console"]
    end

    subgraph APIGateway["Backend API Layer (Node.js + Express + TypeScript)"]
        AuthMW["JWT & SEBI RBAC Middleware"]
        RateMW["Multi-Tier Rate Limiter & Cache Interceptor"]
        KeepAlive["Render Keep-Alive Daemon (10m Self-Ping)"]
    end

    subgraph CoreEngines["Deterministic Domain & Compliance Engines"]
        QuantRisk["Risk Profiling & Conflict Resolver"]
        QuantGoal["Goal Corpus, SIP & Glide Path Calculator"]
        QuantPort["AMFI Direct-Plan Ranker & 10-Yr Backtester"]
        RagService["Hybrid Vector + Keyword RAG Engine\n(Page-Level Citation Enforcer)"]
        GuardService["SEBI IA Reg 2013 Guardrail Interceptor"]
        HitlState["HITL Cryptographic Approval State Machine"]
    end

    subgraph SingleAIGateway["Opaque Single-Provider AI Layer (Zero Caller Coupling)"]
        Router["AIProviderGateway.complete()"]
        Gemini["Primary: Google Gemini (gemini-2.5-flash)"]
        Groq["Fallback: Groq Cloud (llama-3.3-70b-versatile)"]
        DetSynth["Zero-Downtime Deterministic Synthesis Fallback"]
    end

    subgraph DataLayer["Dual-Mode Persistence & Vector Layer"]
        Mongo["MongoDB Atlas (Documents + Atlas Vector Search)"]
        Redis["Upstash Redis (Response & Session Cache)"]
        LocalStore["In-Memory + Local Seed Mirror (Instant Offline/Judge Readiness)"]
    end

    ClientLayer <-->|"REST JSON over HTTPS"| APIGateway
    APIGateway --> CoreEngines
    CoreEngines --> SingleAIGateway
    Router -->|"1. Try Primary (<7.5s)"| Gemini
    Router -.->|"2. Circuit-Breaker Fallback"| Groq
    Router -.->|"3. Guaranteed Grounded Fallback"| DetSynth
    CoreEngines <--> DataLayer
```

---

## 2. Single-Provider AI Layer Architecture (Requirement #10)

A strict architectural requirement of this project is:
> *"For AI layer, make it with both Gemini and Groq, with Gemini being the primary, Groq being the fallback. There should be a single provider layer, and our system must not know whether they are talking to Gemini or Groq."*

### Architectural Enforcement
1. **Strict Encapsulation:** Neither any route controller (`plans.routes.ts`, `rag.routes.ts`, `guardrails.routes.ts`) nor any domain service (`riskEngine.ts`, `ragEngine.ts`, `guardrailEngine.ts`) imports `@google/genai`, `groq-sdk`, or provider-specific environment variables.
2. **Unified Interface (`src/services/ai/aiGateway.ts`):**
   - Domain modules invoke `await aiGateway.generate(request: AIRequest): Promise<AIResponse>`.
   - Internally, `AIProviderGateway` maintains provider health counters and a circuit-breaker state machine (`CLOSED` $\rightarrow$ `HALF_OPEN` $\rightarrow$ `OPEN`).
   - If `GeminiProvider` succeeds, the response is normalized into standard `{ content, citations, verified }` format.
   - If `GeminiProvider` throws an error, hits rate limit (`429`), or exceeds timeout, `GroqProvider` is transparently invoked within the same call stack without bubbling any provider exception to the caller.

```mermaid
sequenceDiagram
    participant Caller as Domain Service (RAG / Plan / Guardrail)
    participant Gateway as AIProviderGateway (Single Interface)
    participant Gemini as GeminiAdapter (Primary)
    participant Groq as GroqAdapter (Fallback)
    participant Det as GroundedTemplateAdapter (Safety Net)

    Caller->>Gateway: generate({ systemPrompt, userPrompt, contextChunks })
    Gateway->>Gemini: invoke(prompt)
    alt Gemini Healthy & Under Quota
        Gemini-->>Gateway: Raw Completion
    else Gemini Error / Timeout / Quota Exceeded
        Gateway->>Groq: invoke(prompt)
        alt Groq Healthy
            Groq-->>Gateway: Raw Completion
        else Both External APIs Unavailable
            Gateway->>Det: synthesizeFromVerifiedChunks(contextChunks)
            Det-->>Gateway: Grounded Citation-Verified Completion
        end
    end
    Gateway->>Gateway: Strip provider metadata & validate page citations
    Gateway-->>Caller: Normalized AIResponse (Caller never knows which provider answered)
```

---

## 3. Data Flow: Persona to Adviser-Approved Plan (< 15 Seconds)

1. **Step 1 (0.0s – 0.05s): Persona Ingestion & Risk Separation**
   - `riskEngine.ts` computes `Risk Capacity Score (RC)` from objective balance sheet & cashflow variables and `Risk Tolerance Score (RT)` from behavioural inputs.
   - Applies the Conflict Resolution Rule (`ERS = min(RC, RT)` when tolerance exceeds capacity or age/liquidity constraints trigger) and emits structured conflict flags.
2. **Step 2 (0.05s – 0.10s): Inflation-Adjusted Goal & Glide Path Computation**
   - `goalPlanner.ts` maps each goal to RBI DBIE inflation rates, computes required Future Corpus, deducts existing earmarked assets, solves for exact monthly SIP & 10% step-up SIP, and builds the multi-stage Glide Path table from Year 0 to Goal Maturity.
3. **Step 3 (0.10s – 0.15s): AMFI Direct-Plan Shortlisting & 10-Year Backtest**
   - `portfolioBuilder.ts` filters the AMFI Direct-Plan universe by TER, Tracking Error, 3Y/5Y Rolling Returns, Max Drawdown, AUM, and Manager Tenure.
   - Executes a 10-year historical simulation (2016–2026) comparing the blended portfolio against Nifty 50 TRI and CRISIL Hybrid 35+65 Index.
4. **Step 4 (0.15s – 1.2s): SEBI Guardrail Validation & Cited AI Executive Rationale**
   - `guardrailEngine.ts` audits the plan against SEBI IA Regulations 2013 (checking for unsuitable requests like 68yo asking for 100% small-cap, or F&O loss recovery speculation).
   - `aiGateway.ts` generates the executive advisory memo citing exact SID/Factsheet page numbers.
5. **Step 5 (Human-in-the-Loop Gate): Adviser Review & Cryptographic Sign-Off**
   - The plan lands in `PENDING_ADVISER_REVIEW`. Client export is locked.
   - The RIA inspects the conflict resolution, glide path, 10-year backtest, and citations, then clicks **"Approve & Sign Plan for Client"**, generating an immutable SHA-256 signature and unlocking the Client Report.
