import type { UsageProvider } from './types.js';
import { OpenRouterProvider } from './openrouter.js';
import { YandexProvider } from './yandex.js';

export type { UsageProvider, ProviderUsage } from './types.js';

export const providers: UsageProvider[] = [
  new OpenRouterProvider(),
  new YandexProvider()
];

export function getProvider(id: string): UsageProvider | undefined {
  return providers.find((p) => p.id === id);
}
