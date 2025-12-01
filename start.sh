#!/usr/bin/env bash
set -euo pipefail

# Deployment script for Railpack / generic container
# Steps: install deps, generate prisma, run migrations, build TS, start bot

cd "$(dirname "$0")/backend"

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
