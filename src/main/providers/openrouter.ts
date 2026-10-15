import type { ProviderUsage, UsageProvider } from './types.js';

const KEY_INFO_URL = 'https://openrouter.ai/api/v1/auth/key';

interface KeyInfoResponse {
  data?: {
    usage?: number;
    limit?: number | null;
    limit_remaining?: number | null;
    is_free_tier?: boolean;
  };
  error?: { message?: string };
}

export class OpenRouterProvider implements UsageProvider {
  readonly id = 'openrouter';
  readonly name = 'OpenRouter';

  async fetchUsage(apiKey: string): Promise<ProviderUsage> {
    const res = await fetch(KEY_INFO_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000)
    });

    if (res.status === 401) {
      throw new Error('Invalid API key');
    }
    if (!res.ok) {
      throw new Error(`OpenRouter API error: HTTP ${res.status}`);
    }

    const body = (await res.json()) as KeyInfoResponse;
    const data = body.data;
    if (!data) {
      throw new Error(body.error?.message ?? 'Unexpected OpenRouter response');
    }

    return {
      usage: typeof data.usage === 'number' ? data.usage : null,
      limit: data.limit ?? null,
      limitRemaining: data.limit_remaining ?? null,
      currency: 'USD'
    };
  }
}
