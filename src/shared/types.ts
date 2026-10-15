export interface UsageData {
  providerId: string;
  providerName: string;
  usage: number | null;
  limit: number | null;
  limitRemaining: number | null;
  currency: string;
  updatedAt: number;
  error: string | null;
}

export interface AppState {
  configured: boolean;
  hotkey: string;
  pollIntervalSec: number;
  usage: UsageData[];
}

export type SetKeyResult = { ok: true } | { ok: false; error: string };
