#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "[start-local] node is required" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[start-local] npm is required" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "[start-local] Installing dependencies with npm ci"
  if [ "${SOCIAL_ANALYZER_DRY_RUN:-0}" = "1" ]; then
    echo "npm ci"
  else
    npm ci
  fi
fi

echo "[start-local] Starting web app at http://localhost:9005/app.html"
if [ "${SOCIAL_ANALYZER_DRY_RUN:-0}" = "1" ]; then
  echo "npm start"
  exit 0
fi

exec npm start
