import { env, isRealGeminiConfigured } from '../../config/env';

export interface InternalLLMCallParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  responseFormat?: 'json' | 'text';
}

export class GeminiProvider {
  public readonly providerCode = 'PRIMARY_ENGINE_A';

  isConfigured(): boolean {
    return isRealGeminiConfigured();
  }

  async complete(params: InternalLLMCallParams): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Primary AI provider API key not configured.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), env.AI_REQUEST_TIMEOUT_MS);

    try {
      const model = env.GEMINI_PRIMARY_MODEL || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

      const body: Record<string, unknown> = {
        systemInstruction: {
          parts: [{ text: params.systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: params.userPrompt }],
          },
        ],
        generationConfig: {
          temperature: params.temperature ?? 0.15,
          maxOutputTokens: 1200,
          ...(params.responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}),
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini HTTP ${response.status}: ${errBody.slice(0, 180)}`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) {
        throw new Error('Empty completion returned from Primary AI provider.');
      }

      return text;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
