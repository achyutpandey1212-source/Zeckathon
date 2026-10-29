import {
  IClientPersona,
  IFinancialPlan,
  IHealthTelemetry,
  IRagDocumentChunk,
  IRagQueryResponse,
} from '../types/api.types';

function resolveApiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!raw) return '/api/v1';
  if (raw.endsWith('/api/v1')) return raw;
  return `${raw}/api/v1`;
}

const API_BASE = resolveApiBase();

class ApiService {
  private token: string | null = null;

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  async initDemoSession() {
    const res = await fetch(`${API_BASE}/auth/demo-session`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to initialize RIA session');
    const data = await res.json();
    this.token = data.accessToken;
    return data;
  }

  async getHealth(): Promise<IHealthTelemetry> {
    const res = await fetch(`${API_BASE}/health`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  }

  async triggerKeepAlivePing() {
    const res = await fetch(`${API_BASE}/health/keep-alive`, { headers: this.getHeaders() });
    return res.json();
  }

  async getPersonas(): Promise<IClientPersona[]> {
    const res = await fetch(`${API_BASE}/personas`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load personas');
    const data = await res.json();
    return data.personas;
  }

  async createCustomPersona(payload: Partial<IClientPersona>): Promise<{ persona: IClientPersona; plan: IFinancialPlan }> {
    const res = await fetch(`${API_BASE}/personas`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create custom persona');
    return res.json();
  }

  async getPlanByPersona(personaId: string): Promise<IFinancialPlan> {
    const res = await fetch(`${API_BASE}/plans/by-persona/${personaId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch plan');
    const data = await res.json();
    return data.plan;
  }

  async generatePlan(personaId: string, useAiNarrative = false): Promise<IFinancialPlan> {
    const res = await fetch(`${API_BASE}/plans/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ personaId, useAiNarrative }),
    });
    if (!res.ok) throw new Error('Failed to generate plan');
    const data = await res.json();
    return data.plan;
  }

  async approvePlan(
    planId: string,
    params: {
      action: 'APPROVE' | 'OVERRIDE_AND_APPROVE' | 'REJECT';
      adviserNotes: string;
      overrideRationale?: string;
      adviserName?: string;
      sebiRegNo?: string;
    }
  ): Promise<IFinancialPlan> {
    const res = await fetch(`${API_BASE}/plans/${planId}/approve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to approve plan');
    const data = await res.json();
    return data.plan;
  }

  async getFundsUniverse(assetClass = 'ALL') {
    const res = await fetch(`${API_BASE}/funds?assetClass=${assetClass}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch AMFI funds');
    return res.json();
  }

  async getRagDocuments(): Promise<{
    totalChunks: number;
    documents: IRagDocumentChunk[];
    benchmarkQuestions: Array<{
      id: string;
      questionNumber: number;
      category: string;
      question: string;
      expectedFactKeywords: string[];
      expectedCitationDocId: string;
      expectedPageNumber: number;
    }>;
  }> {
    const res = await fetch(`${API_BASE}/rag/documents`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch RAG documents');
    return res.json();
  }

  async queryRag(query: string, fastMode = false): Promise<IRagQueryResponse> {
    const res = await fetch(`${API_BASE}/rag/query`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ query, fastMode }),
    });
    if (!res.ok) throw new Error('Failed to execute RAG query');
    return res.json();
  }

  async runRag25Benchmark() {
    const res = await fetch(`${API_BASE}/rag/benchmark-25`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to run 25-question benchmark');
    return res.json();
  }

  async validateGuardrailPrompt(prompt: string) {
    const res = await fetch(`${API_BASE}/guardrails/validate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error('Failed to validate guardrail prompt');
    return res.json();
  }

  async runAdversarial10Suite() {
    const res = await fetch(`${API_BASE}/guardrails/adversarial-suite`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to run 10-adversarial suite');
    return res.json();
  }

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/audit/logs`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load audit logs');
    return res.json();
  }
}

export const api = new ApiService();
