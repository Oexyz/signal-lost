# Architecture decisions

## ADR-001: Server-authoritative game state

Clients submit intents. The server alone validates and mutates canonical state. This prevents browser state from becoming an authority and gives revision/replay rules one enforcement point.

## ADR-002: Construct per-player projections

Projection code constructs a fresh client DTO for a specific viewer. It never sends a complete state and hides fields afterward. This reduces accidental secret leakage through serialized objects, interface state, and browser inspection.

## ADR-003: Versioned strict wire schemas

Protocol messages use a discriminated, versioned envelope with strict object schemas. Actor identity is derived from the connection, not accepted from action payloads.

## ADR-004: Declarative scenario language

Community scenario data is parsed and validated as data. Arbitrary executable scenario code is not supported.

## ADR-005: One workspace, no task runner yet

pnpm workspace scripts are sufficient for the initial applications and packages. A caching task runner will be considered only after measured build complexity justifies it.

## ADR-006: Direct server-side bundling

The two Node.js build targets use small checked-in esbuild configurations and a separate TypeScript declaration pass. This keeps internal server-only packages inside the deployed bundle, preserves external runtime dependencies, and avoids an unnecessary bundler wrapper and its additional dependency graph.
