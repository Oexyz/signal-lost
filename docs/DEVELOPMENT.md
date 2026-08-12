# Development

## Requirements

- Node.js 24 LTS
- Corepack and pnpm 11.21.0
- Docker Compose when working on PostgreSQL persistence

## Bootstrap

```text
corepack enable pnpm
pnpm install
pnpm setup
pnpm dev
```

The setup script creates `.env.local` once and never prints or replaces its session secret. When Docker Compose is unavailable, the Phase 0 application remains usable without persistence.

The Compose database uses the official PostgreSQL 18.4 image pinned by digest. Its port is bound only to `127.0.0.1`, and its fixed development password must never be reused outside local development.

## Checks

```text
pnpm check
pnpm test:e2e
```

`pnpm check` runs lint, type checking, unit/property tests, scenario validation, source audits, and the production build in a stable order.

## Configuration

`.env.example` documents all current variables. Public legal information is configuration, not a secret. Production secrets must never be placed in browser variables, committed environment files, container layers, or documentation.
