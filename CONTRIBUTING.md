# Contributing to SIGNAL//LOST

SIGNAL//LOST welcomes focused contributions to game logic, scenarios, accessibility, interface design, documentation, and tests.

## Development setup

```text
corepack enable pnpm
pnpm install
pnpm setup
pnpm dev
```

The setup command writes only ignored local configuration. Never commit `.env.local`, credentials, database dumps, browser traces, or private player data.

## Before opening a change

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm scenario:validate
pnpm legal:check
pnpm privacy:check
pnpm assets:check
pnpm build
```

Run `pnpm test:e2e` for changes to public routes, navigation, assets, or browser network behavior.

## Design and security boundaries

- Clients submit intents; clients do not mutate authoritative state.
- A browser receives only its player's projection.
- New browser storage or external services require privacy documentation and review.
- Runtime assets are local to the deployment.
- User-provided text is untrusted and must not be rendered as arbitrary HTML.
- Scenario contributions must remain declarative and may not execute arbitrary code.

## Scenario contributions

Scenario source necessarily contains spoilers. Keep fictional data fictional, validate all references, and include tests for endings, projections, and information isolation.

## Vulnerabilities

Do not open a public issue for a suspected security vulnerability. Follow [SECURITY.md](SECURITY.md).
