# Security model

## Protected assets

- canonical scenario state and endings;
- server seed and per-player drift;
- session and reconnect credentials;
- private choices and other players' evidence;
- authoritative revisions and event history.

## Trust boundaries

The browser is untrusted. A client message is an intent, not state. Actor identity comes from the authenticated connection or session, never from an action payload.

Every incoming message is schema-validated with bounded strings, safe integer revisions, strict object keys, and a known protocol version. Every action is checked against role capability, current phase, resources, expected revision, and prior action IDs.

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
