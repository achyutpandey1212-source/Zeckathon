import { env, isRealGroqConfigured } from '../../config/env';
import { InternalLLMCallParams } from './gemini.provider';

export class GroqProvider {
  public readonly providerCode = 'FALLBACK_ENGINE_B';

  isConfigured(): boolean {
    return isRealGroqConfigured();
  }

  async complete(params: InternalLLMCallParams): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Fallback AI provider API key not configured.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), env.AI_REQUEST_TIMEOUT_MS);

    try {
      const url = 'https://api.groq.com/openai/v1/chat/completions';
      const body: Record<string, unknown> = {
        model: env.GROQ_FALLBACK_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
        temperature: params.temperature ?? 0.15,
        max_tokens: 1200,
        ...(params.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Groq HTTP ${response.status}: ${errBody.slice(0, 180)}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{
          message?: { content?: string };
        }>;
      };

      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error('Empty completion returned from Fallback AI provider.');
      }

      return text;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
