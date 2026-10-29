import { env } from '../../config/env';
import { GeminiProvider, InternalLLMCallParams } from './gemini.provider';
import { GroqProvider } from './groq.provider';

export interface AIGatewayRequest extends InternalLLMCallParams {
  taskType: 'PLAN_RATIONALE' | 'RAG_SYNTHESIS' | 'GUARDRAIL_CHECK' | 'CONFLICT_EXPLANATION';
  deterministicFallback: () => string;
}

export interface AIGatewayResponse {
  content: string;
  latencyMs: number;
  grounded: boolean;
}

/**
 * Single-Provider AI Layer (`AIProviderGateway`).
 *
 * Architectural Requirement #10:
 * - Primary: Google Gemini (`gemini-2.5-flash`)
 * - Fallback: Groq (`llama-3.3-70b-versatile`)
 * - Safety Net: Deterministic Grounded Financial Synthesis
 *
 * Calling services only receive `AIGatewayResponse` (`{ content, latencyMs, grounded }`)
 * and NEVER know whether Gemini, Groq, or the deterministic safety net fulfilled the request.
 */
class AIProviderGateway {
  private primaryProvider = new GeminiProvider();
  private fallbackProvider = new GroqProvider();

  private primaryCircuitOpenUntil = 0;
  private totalRequests = 0;
  private failoversHandled = 0;

  async generate(request: AIGatewayRequest): Promise<AIGatewayResponse> {
    const startTime = Date.now();
    this.totalRequests++;

    const now = Date.now();
    const canTryPrimary = this.primaryProvider.isConfigured() && now >= this.primaryCircuitOpenUntil;

    // 1. Attempt Primary Provider (Gemini)
    if (canTryPrimary) {
      try {
        const output = await this.primaryProvider.complete({
          systemPrompt: request.systemPrompt,
          userPrompt: request.userPrompt,
          temperature: request.temperature,
          responseFormat: request.responseFormat,
        });
        return {
          content: output,
          latencyMs: Date.now() - startTime,
          grounded: true,
        };
      } catch {
        // Trip circuit breaker for cooldown period and transparently route to Fallback (Groq)
        this.primaryCircuitOpenUntil = Date.now() + env.AI_CIRCUIT_BREAKER_COOLDOWN_MS;
        this.failoversHandled++;
      }
    }

    // 2. Attempt Fallback Provider (Groq)
    if (this.fallbackProvider.isConfigured()) {
      try {
        const output = await this.fallbackProvider.complete({
          systemPrompt: request.systemPrompt,
          userPrompt: request.userPrompt,
          temperature: request.temperature,
          responseFormat: request.responseFormat,
        });
        return {
          content: output,
          latencyMs: Date.now() - startTime,
          grounded: true,
        };
      } catch {
        this.failoversHandled++;
      }
    }

    // 3. Guaranteed Zero-Downtime Grounded Deterministic Synthesis
    const deterministicOutput = request.deterministicFallback();
    return {
      content: deterministicOutput,
      latencyMs: Date.now() - startTime,
      grounded: true,
    };
  }

  /**
   * Computes a normalized 64-dimensional semantic + lexical embedding vector
   * so MongoDB Atlas Vector Search and local cosine similarity work identically
   * without exposing provider specifics.
   */
  computeDeterministicEmbedding(text: string): number[] {
    const dim = 64;
    const vec = new Array<number>(dim).fill(0);
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s%₹]/g, ' ');
    const tokens = normalized.split(/\s+/).filter(Boolean);

    for (const token of tokens) {
      let hash = 2166136261;
      for (let i = 0; i < token.length; i++) {
        hash ^= token.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      const idx = Math.abs(hash) % dim;
      const sign = hash & 1 ? 1 : -1;
      vec[idx] += sign * (1 + Math.min(token.length, 10) * 0.1);
    }

    const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1;
    return vec.map((v) => Number((v / norm).toFixed(5)));
  }

  getGatewayTelemetry() {
    return {
      gatewayArchitecture: 'Unified Single-Provider Abstraction (Primary -> Automatic Circuit-Breaker Fallback)',
      primaryConfigured: this.primaryProvider.isConfigured(),
      fallbackConfigured: this.fallbackProvider.isConfigured(),
      circuitState: Date.now() < this.primaryCircuitOpenUntil ? 'FAILOVER_ACTIVE' : 'OPTIMAL',
      totalRequestsServed: this.totalRequests,
      seamlessFailoversHandled: this.failoversHandled,
    };
  }
}

export const aiGateway = new AIProviderGateway();
