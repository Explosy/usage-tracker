import { BrowserWindow, screen } from 'electron';
import { join } from 'node:path';

const WIDTH = 340;
const HEIGHT = 250;

export function createPopup(): BrowserWindow {
  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.mjs'),
      sandbox: false
    }
  });

  win.setMenuBarVisibility(false);

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(import.meta.dirname, '../renderer/index.html'));
  }

  return win;
}

export function showPopup(win: BrowserWindow): void {
  const point = screen.getCursorScreenPoint();
  const { workArea } = screen.getDisplayNearestPoint(point);
  const bounds = win.getBounds();

  const x = clamp(
    point.x - bounds.width / 2,
    workArea.x + 8,
    workArea.x + workArea.width - bounds.width - 8
  );
  const y = clamp(
    point.y + 20,
    workArea.y + 8,
    workArea.y + workArea.height - bounds.height - 8
  );

  win.setPosition(Math.round(x), Math.round(y));
  win.show();
  win.focus();
}

export function togglePopup(win: BrowserWindow): void {
  if (win.isVisible()) {
    win.hide();
  } else {
    showPopup(win);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
