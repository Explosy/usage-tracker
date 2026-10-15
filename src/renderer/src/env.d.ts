import type { AppState, SetKeyResult, UsageData } from '@shared/types';

declare global {
  interface Window {
    usageTracker: {
      getState(): Promise<AppState>;
      refresh(): Promise<UsageData[]>;
      setApiKey(providerId: string, apiKey: string): Promise<SetKeyResult>;
      hide(): Promise<void>;
      resize(height: number): Promise<void>;
      onUsage(callback: (usage: UsageData[]) => void): () => void;
    };
  }
}

export {};
