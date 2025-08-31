# BasterdsLegacy — Shockbyte‑like Single‑Server Panel

Monorepo semplice: frontend React + Vite e backend Fastify TS single‑service.

## Requisiti

- Node.js 20+

## Script

- dev: vite
- build: tsc -b && vite build
- preview: vite preview
- lint: eslint .
- format / format:check: Prettier
- type-check: tsc -b --pretty
- test: vitest

## Struttura

- server/: backend Fastify TS (porta 3000)
- src/: frontend React

## Dev

1. Installazione dipendenze
2. Avvio frontend: npm run dev
3. Avvio backend: node server/src/app.ts (ts-node/tsup consigliati per dev locale)

Proxy vite: /api → http://localhost:3000
