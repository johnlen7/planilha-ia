#!/usr/bin/env bash
set -euo pipefail

# Deployment script for Railpack / generic container
# Steps: install deps, generate prisma, run migrations, build TS, start bot

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="$ROOT_DIR/mise/shims:$ROOT_DIR/mise/installs/node/22.21.1/bin:$PATH"
# fallback: pick first node bin under mise installs if version changes
if ! command -v node >/dev/null 2>&1 && [ -d "$ROOT_DIR/mise/installs" ]; then
  NODE_BIN="$(find "$ROOT_DIR/mise/installs" -maxdepth 4 -type f -name node | head -n 1 || true)"
  if [ -n "$NODE_BIN" ]; then
    export PATH="$(dirname "$NODE_BIN"):$PATH"
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[start] node not found even after PATH adjustment; aborting" >&2
  exit 1
fi
cd "$ROOT_DIR/backend"

echo "[start] Installing production dependencies" >&2
if command -v npm >/dev/null 2>&1; then
  if [ -f package-lock.json ]; then
    npm ci --omit=dev
  else
    npm install --omit=dev
  fi

  echo "[start] Generating Prisma client" >&2
  npx prisma generate

  echo "[start] Deploying migrations" >&2
  npx prisma migrate deploy || echo "[warn] migrate deploy failed (maybe no migrations)" >&2

  echo "[start] Building TypeScript" >&2
  npm run build
else
  echo "[start] npm not available, assuming build artifacts and node_modules are already present; skipping install/prisma steps" >&2
fi

echo "[start] Launching bot" >&2
node dist/index.js
