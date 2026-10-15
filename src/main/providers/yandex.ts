import type { ProviderUsage, UsageProvider } from './types.js';

export class YandexProvider implements UsageProvider {
  readonly id = 'yandex';
  readonly name = 'Yandex Cloud';

  async fetchUsage(_apiKey: string): Promise<ProviderUsage> {
    throw new Error('Yandex provider is not implemented yet');
  }
}
