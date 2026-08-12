# Changelog

All notable changes will be documented in this file.

The project uses semantic versioning for published releases. No release has been published.

## Unreleased

### Added

- Independent pnpm workspace foundation.
- Initial public interface, protocol, game-engine, server, and scenario validation structure.
- Local setup and deterministic legal, privacy, and asset audit commands.
- Initial architecture, security, privacy, development, and scenario documentation.
- Exact `SIGNAL//LOST` branding audit and real production-build screenshot.
- Production-like browser coverage for routes, accessibility focus, the local C03 handoff, browser persistence, and network origins.
- Digest-pinned non-root server image, loopback-only PostgreSQL Compose service, and container CI gate.
- Bounded readiness and graceful shutdown behavior with strict production-origin configuration.

### Changed

- Phase 0 documentation now distinguishes tested engine/protocol boundaries from the not-yet-implemented live multiplayer transport.
- Server and Scenario SDK builds now use direct pinned esbuild configurations instead of an additional bundler wrapper.

### Security

- Removed the dependency path that retained esbuild 0.27 and resolved the complete workspace to esbuild 0.28.2.
