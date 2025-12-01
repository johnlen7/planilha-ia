#!/usr/bin/env bash
set -euo pipefail

# Deployment script for Railpack / generic container
# Steps: install deps, generate prisma, run migrations, build TS, start bot

cd "$(dirname "$0")/backend"

echo "[start] Installing production dependencies" >&2
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "[start] Generating Prisma client" >&2
npx prisma generate

echo "[start] Deploying migrations" >&2
npx prisma migrate deploy || echo "[warn] migrate deploy failed (maybe no migrations)" >&2

echo "[start] Building TypeScript" >&2
npm run build

echo "[start] Launching bot" >&2
node dist/index.js
