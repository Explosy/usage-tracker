import { contextBridge, ipcRenderer } from 'electron';
import type { AppState, SetKeyResult, UsageData } from '../shared/types.js';

const api = {
  getState: (): Promise<AppState> => ipcRenderer.invoke('app:getState'),
  refresh: (): Promise<UsageData[]> => ipcRenderer.invoke('usage:refresh'),
  setApiKey: (providerId: string, apiKey: string): Promise<SetKeyResult> =>
    ipcRenderer.invoke('key:set', providerId, apiKey),
  hide: (): Promise<void> => ipcRenderer.invoke('app:hide'),
  resize: (height: number): Promise<void> =>
    ipcRenderer.invoke('window:setContentSize', height),
  onUsage: (callback: (usage: UsageData[]) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, usage: UsageData[]) =>
      callback(usage);
    ipcRenderer.on('usage:updated', listener);
    return () => ipcRenderer.removeListener('usage:updated', listener);
  }
};

export type UsageTrackerApi = typeof api;

contextBridge.exposeInMainWorld('usageTracker', api);
