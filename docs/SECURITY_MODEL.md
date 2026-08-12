# Security model

## Protected assets

- canonical scenario state and endings;
- server seed and per-player drift;
- session and reconnect credentials;
- private choices and other players' evidence;
- authoritative revisions and event history.

## Trust boundaries

The browser is untrusted. A client message is an intent, not state. In the target live-session design, actor identity comes from the authenticated connection or session, never from an action payload.

Phase 0 defines and tests schema validation with bounded strings, safe integer revisions, strict object keys, and a known protocol version. The engine checks the implemented C03 action against role capability, expected revision, and prior action IDs. Live transport, session identity, broader phase/resource checks, and rate limiting remain roadmap work.

## Projection isolation

Projection functions construct new client-safe objects from canonical state. They do not remove fields from a canonical object and do not rely on CSS or interface hiding. Tests serialize actual wire payloads and search for unique secret sentinels as well as forbidden keys.

## Browser and transport policy

- no invasive anti-cheat or device fingerprinting;
- no client authority over game state or time;
- explicit production origins for HTTP and WebSocket traffic;
- restrictive content security and permissions policies;
- bounded request and WebSocket message sizes;
- secure, HTTP-only, same-site cookies for future resume sessions;
- no production stack traces in client errors.

## Current limitations

Phase 0 does not yet implement multiplayer sessions, persistence, rate limiting, or secure reconnect. Those absences are tracked as roadmap work and must not be represented as deployed protections.
