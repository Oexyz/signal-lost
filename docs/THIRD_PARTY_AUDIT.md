# Third-party audit

## Runtime browser services

None.

## Server-side services

PostgreSQL 18.4 is declared through its official container image for optional local development only. It binds to the loopback interface and uses no production data.

## Build dependencies

Dependencies are installed from package registries at build time and pinned by `pnpm-lock.yaml`. Their licenses require a complete review before release.

On 2026-08-12, `pnpm audit --prod --audit-level high` reported no known vulnerabilities in the resolved production dependency graph. `pnpm licenses list --prod --json` reported MIT, BSD-3-Clause, and ISC license families. These are time-bound registry and metadata checks, not a legal certification or a substitute for the release review.

The production server container was built from its digest-pinned base, reached a healthy state, ran as UID/GID 1000:1000, contained no development tools, and stopped cleanly on SIGTERM. Container and operating-system packages still require a dedicated vulnerability scan before a release.

## Fonts

No third-party font files are included.

## Images

The repository header is an original local SVG. No remote or third-party image is included.

## Audio and video

None.

## External navigation

None is enabled in the initial public interface. An ordinary navigation link may be added only after the destination exists and is reviewed.
