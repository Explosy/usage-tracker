import { app, globalShortcut, ipcMain, screen } from 'electron';
import type { AppState, SetKeyResult, UsageData } from '../shared/types.js';
import { createPopup, showPopup, togglePopup } from './popup.js';
import { createTray } from './tray.js';
import { getProvider, providers } from './providers/index.js';
import {
  getApiKey,
  getHotkey,
  getPollIntervalSec,
  hasAnyKey,
  initStorage,
  setApiKey
} from './storage.js';

let popup: Electron.BrowserWindow;
let lastUsage: UsageData[] = [];

async function refreshUsage(): Promise<UsageData[]> {
  const results = await Promise.all(
    providers.map(async (provider): Promise<UsageData | null> => {
      const key = getApiKey(provider.id);
      if (!key) return null;
      try {
        const usage = await provider.fetchUsage(key);
        return {
          providerId: provider.id,
          providerName: provider.name,
          ...usage,
          updatedAt: Date.now(),
          error: null
        };
      } catch (err) {
        return {
          providerId: provider.id,
          providerName: provider.name,
          usage: null,
          limit: null,
          limitRemaining: null,
          currency: 'USD',
          updatedAt: Date.now(),
          error: err instanceof Error ? err.message : String(err)
        };
      }
    })
  );
  lastUsage = results.filter((r): r is UsageData => r !== null);
  return lastUsage;
}

function pushUsage(): void {
  if (!popup.isDestroyed() && popup.isVisible()) {
    popup.webContents.send('usage:updated', lastUsage);
  }
}

async function refreshAndPush(): Promise<void> {
  await refreshUsage();
  pushUsage();
}

function registerIpc(): void {
  ipcMain.handle('app:getState', async (): Promise<AppState> => {
    return {
      configured: hasAnyKey(),
      hotkey: getHotkey(),
      pollIntervalSec: getPollIntervalSec(),
      usage: lastUsage
    };
  });

  ipcMain.handle('usage:refresh', async () => refreshUsage());

  ipcMain.handle(
    'key:set',
    async (_event, providerId: string, apiKey: string): Promise<SetKeyResult> => {
      const provider = getProvider(providerId);
      if (!provider) return { ok: false, error: `Unknown provider: ${providerId}` };
      const trimmed = apiKey.trim();
      if (!trimmed) return { ok: false, error: 'API key is empty' };
      try {
        await provider.fetchUsage(trimmed);
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
      setApiKey(providerId, trimmed);
      await refreshAndPush();
      return { ok: true };
    }
  );

  ipcMain.handle('app:hide', () => popup.hide());

  ipcMain.handle('window:setContentSize', (_event, height: number) => {
    if (popup.isDestroyed() || !Number.isFinite(height)) return;
    const { workArea } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const maxHeight = workArea.height - 16;
    const h = Math.min(Math.max(Math.round(height), 100), maxHeight);
    popup.setContentSize(340, h);

    const bounds = popup.getBounds();
    const y = Math.min(bounds.y, workArea.y + workArea.height - h - 8);
    const clampedY = Math.max(y, workArea.y + 8);
    if (clampedY !== bounds.y) popup.setPosition(bounds.x, clampedY);
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (popup && !popup.isDestroyed()) showPopup(popup);
  });

  void app.whenReady().then(() => {
    initStorage();
    registerIpc();

    popup = createPopup();
    popup.on('blur', () => {
      if (hasAnyKey() && !popup.isDestroyed()) popup.hide();
    });
    popup.on('show', () => void refreshAndPush());

    createTray(getHotkey(), () => togglePopup(popup));

    const hotkey = getHotkey();
    const registered = globalShortcut.register(hotkey, () => togglePopup(popup));
    if (!registered) {
      console.error(`Failed to register global shortcut: ${hotkey}`);
    }

    setInterval(() => void refreshUsage(), getPollIntervalSec() * 1000);
    void refreshUsage();

    app.on('will-quit', () => globalShortcut.unregisterAll());
  });

  app.on('window-all-closed', () => {
    // Tray app: stay running when all windows are closed.
  });
}
