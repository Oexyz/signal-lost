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

The first implementation slice uses Bulkhead C03. Operations receives a live control reading. Archives receives an eleven-year-old sealing record. The server holds the canonical state, accepts only validated intents, and sends each role a separately constructed projection.

This small case establishes the boundaries needed by the larger game: deterministic state changes, monotonically increasing revisions, replay protection, role permissions, and tests that look for information leaking into serialized player data.

The next milestone is to connect this slice through an invite-only two-player session and verify both perspectives in separate browser contexts before expanding ORPHEUS-17.
