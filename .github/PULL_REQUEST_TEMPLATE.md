## Summary

Describe the player-facing or technical change and its scope.

## Verification

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] Relevant scenario, audit, build, and browser checks

## Boundaries

- [ ] No canonical or role-private data is exposed to a browser that should not receive it.
- [ ] New storage, network origins, services, and assets are documented and reviewed.
- [ ] No credentials, private data, generated traces, or local configuration are included.
