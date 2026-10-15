#!/usr/bin/env bash
# Fails fast when the self-hosted host is missing what a Windows
# cross-build needs, so a broken host costs seconds, not a build.
#
# Unlike lead-aid's Electron Forge pipeline (which needs wine64 + mono
# for Squirrel), electron-builder only shells out to `wine` — it runs
# rcedit under Wine to stamp the installer's icon and version metadata.

set -uo pipefail

missing=0

require_cmd() {
  local cmd="$1" why="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "::error::missing '$cmd' - $why"
    missing=1
  else
    echo "ok: $cmd ($(command -v "$cmd"))"
  fi
}

echo "--- preflight: $(uname -s) $(uname -m) ---"

require_cmd wine "electron-builder runs rcedit under Wine to stamp installer metadata/icon"
require_cmd node "the build runs on Node"
require_cmd npm "dependencies are installed with npm"

node_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$node_major" -lt 20 ]; then
  echo "::error::Node $node_major is too old - the toolchain targets Node 20+"
  missing=1
else
  echo "ok: node major $node_major"
fi

if [ "$missing" -ne 0 ]; then
  exit 1
fi

echo "--- preflight passed ---"
