export interface ProviderUsage {
  usage: number | null;
  limit: number | null;
  limitRemaining: number | null;
  currency: string;
}

export interface UsageProvider {
  id: string;
  name: string;
  fetchUsage(apiKey: string): Promise<ProviderUsage>;
}
