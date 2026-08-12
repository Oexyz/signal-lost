---
title: "DEVLOG 000: INITIAL SIGNAL"
date: 2026-08-12
summary: "Establishing the protocol boundary and first contradiction slice."
tags:
  - architecture
  - game-design
milestone: protocol-boot
---

# DEVLOG 000: INITIAL SIGNAL

SIGNAL//LOST begins with a narrow question: what happens when two players must act on incompatible evidence from the same system?

The first implementation slice uses Bulkhead C03. The server-only engine constructs an Operations control reading and an eleven-year-old Archives sealing record from one canonical state. Strict protocol schemas define the bounded intent envelope that a future live session will accept; no gameplay WebSocket route is claimed in Phase 0.

This small case establishes the boundaries needed by the larger game: deterministic state changes, monotonically increasing revisions, replay protection, role permissions, and tests that look for information leaking into serialized player data.

The next milestone is to connect this slice through an invite-only two-player session and verify both perspectives in separate browser contexts before expanding ORPHEUS-17.
