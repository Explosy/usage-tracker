import { app, safeStorage } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

interface Config {
  hotkey: string;
  pollIntervalSec: number;
  encryptedKeys: Record<string, string>;
}

const DEFAULTS: Config = {
  hotkey: 'Ctrl+Alt+U',
  pollIntervalSec: 60,
  encryptedKeys: {}
};

let configPath: string;
let config: Config;

function load(): Config {
  try {
    if (existsSync(configPath)) {
      return { ...DEFAULTS, ...JSON.parse(readFileSync(configPath, 'utf-8')) };
    }
  } catch (err) {
    console.error('Failed to load config, using defaults', err);
  }
  return { ...DEFAULTS };
}

function save(): void {
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export function initStorage(): void {
  configPath = join(app.getPath('userData'), 'config.json');
  config = load();
}

export function getHotkey(): string {
  return config.hotkey;
}

export function getPollIntervalSec(): number {
  return config.pollIntervalSec;
}

export function setApiKey(providerId: string, key: string): void {
  config.encryptedKeys[providerId] = safeStorage.encryptString(key).toString('base64');
  save();
}

export function getApiKey(providerId: string): string | null {
  const blob = config.encryptedKeys[providerId];
  if (!blob) return null;
  try {
    return safeStorage.decryptString(Buffer.from(blob, 'base64'));
  } catch {
    return null;
  }
}

export function hasAnyKey(): boolean {
  return Object.keys(config.encryptedKeys).length > 0;
}
