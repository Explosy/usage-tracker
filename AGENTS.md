# AGENTS.md

## Project

Usage Tracker — Windows tray app (Electron + electron-vite + TypeScript) that shows
OpenRouter API spend in a popup on a global hotkey. API keys are entered at runtime
and stored encrypted via Electron `safeStorage` in `userData/config.json` — never
commit keys or env files. Packaged with electron-builder (NSIS).

## Commands

- `npm run dev` — dev mode
- `npm run build` — compile main/preload/renderer into `out/`
- `npm run typecheck` — `tsc -p` on tsconfig.node.json + tsconfig.web.json
- `npm run dist` — build + Windows NSIS installer into `dist/`
- `npm run icon` — regenerate `resources/` icons

## Releasing

Push a semver tag; CI does the rest:

```bash
git tag v1.0.1 && git push origin v1.0.1
```

- Tag `v*.*.*` → `.github/workflows/release.yml` builds the NSIS installer and
  publishes a GitHub Release **in this repo** (exe + blockmap + latest.yml).
  Tags containing `-` (e.g. `v1.1.0-beta`) are marked as prereleases.
- The tag is the version source of truth: CI syncs `package.json` from the tag
  before building, so bumping `package.json` by hand is optional.
- Push to `release/**` branches, or Actions → Release → Run workflow, builds the
  installer as a workflow artifact only — no GitHub Release.
- Do not re-push an existing tag name to fix a failed release: the workflow runs
  from the tagged commit, so a broken workflow stays broken on rerun. Move the
  tag to a fixed commit instead (`git push origin :refs/tags/vX.Y.Z`, retag, push).

## CI runner

Builds run on a self-hosted CachyOS host: runner `explossy-work-usage-tracker`,
labels `[self-hosted, linux, wine]`. It is a second runner instance registered to
this repo — repo-level runners cannot be shared between repos on a personal
account, so it sits alongside lead-aid's runner on the same machine (runs under
the `ghrunner` user, service `actions.runner.Explosy-usage-tracker.*`).

Platform gotchas already handled in the config — keep them:

- `electron-builder --win` is required — without it the tool builds for the host
  platform (Linux snap/AppImage).
- `--publish never` — otherwise electron-builder tries to publish to GitHub
  itself and fails without `GH_TOKEN`. Releases are created by
  `softprops/action-gh-release` instead.
- `wine` must be on PATH — electron-builder runs rcedit under Wine to stamp the
  installer's icon/version. `scripts/preflight-runner.sh` fails fast if missing.
- The runner workspace is persistent — the job cleans `dist/` and `out/` at the
  end (`.github/workflows/release.yml` Cleanup step).
