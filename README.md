# Usage Tracker

A lightweight Windows tray app that shows your [OpenRouter](https://openrouter.ai) API spend at a glance. Press a global hotkey and a compact popup appears next to the cursor with current usage, credit limit, and remaining balance.

## Features

- Global hotkey (default `Ctrl+Alt+U`) toggles the popup near the cursor
- System tray icon with a context menu (show usage / quit)
- Polls the OpenRouter API every 60 seconds and refreshes whenever the popup opens
- API key is validated against the API before saving, then stored encrypted via the OS keychain (Electron `safeStorage` / DPAPI)
- Auto-hides on focus loss; `Esc` closes the popup
- Provider-based architecture: OpenRouter is implemented, Yandex Cloud is a stub for future expansion

## Getting started

Requirements: Node.js 20+, Windows (the app relies on OS encryption APIs; other platforms are untested).

```bash
npm install
npm run dev
```

On first launch the popup asks for an OpenRouter API key (`sk-or-...`). The key is verified against `openrouter.ai/api/v1/auth/key` before being stored, and is kept in `userData/config.json` in encrypted form.

## Scripts

| Command          | Description                                       |
| ---------------- | ------------------------------------------------- |
| `npm run dev`    | Run the app in development mode                   |
| `npm run build`  | Compile main/preload/renderer into `out/`         |
| `npm run dist`   | Build and package an NSIS installer into `dist/`  |
| `npm run icon`   | Regenerate tray and app icons into `resources/`   |

## Project layout

- `src/main` — main process: tray, popup window, global shortcut, provider polling, encrypted config storage
- `src/main/providers` — usage providers (OpenRouter, Yandex stub); add a new provider by implementing `UsageProvider`
- `src/preload` — context bridge exposing a typed IPC API to the renderer
- `src/renderer` — popup UI (plain HTML/CSS/TS, no framework)
- `src/shared` — types shared between main and renderer
- `scripts/generate-icon.mjs` — generates `resources/tray.png`, `icon.png`, `icon.ico`

## Tech stack

Electron · electron-vite · TypeScript · electron-builder (NSIS)
