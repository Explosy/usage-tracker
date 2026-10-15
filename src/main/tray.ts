import { app, Menu, nativeImage, Tray } from 'electron';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function createTray(hotkey: string, onToggle: () => void): Tray {
  const icon = loadTrayIcon();
  const tray = new Tray(icon);
  tray.setToolTip('Usage Tracker');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: `Show usage (${hotkey})`, click: onToggle },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ])
  );
  tray.on('click', onToggle);
  return tray;
}

function loadTrayIcon() {
  const candidates = [
    join(process.resourcesPath ?? '', 'tray.png'),
    join(import.meta.dirname, '../../resources/tray.png')
  ];
  for (const path of candidates) {
    if (path && existsSync(path)) {
      const icon = nativeImage.createFromPath(path);
      if (!icon.isEmpty()) return icon;
    }
  }
  return nativeImage.createEmpty();
}
