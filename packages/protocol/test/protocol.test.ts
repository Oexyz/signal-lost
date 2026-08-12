import { describe, expect, it } from "vitest";

import {
  ClientActionMessageSchema,
  ClientMessageSchema,
  PROTOCOL_VERSION,
  ServerMessageSchema,
} from "../src/index.js";

describe("version 1 client protocol", () => {
  it("accepts a close-door intent without actor identity", () => {
    const message = {
      protocolVersion: PROTOCOL_VERSION,
      type: "client.action",
      payload: {
        actionId: "action-001",
        expectedRevision: 0,
        intent: { action: "door.close", doorId: "c03" },
      },
    };

    expect(ClientActionMessageSchema.parse(message)).toEqual(message);
  });

  it.each(["actorId", "playerId", "role"])(
    "rejects spoofed %s fields in action payloads",
    (field) => {
      const message = {
        protocolVersion: PROTOCOL_VERSION,
        type: "client.action",
        payload: {
          actionId: "action-001",
          expectedRevision: 0,
          intent: { action: "door.close", doorId: "c03" },
          [field]: "operations",
        },
      };

      expect(ClientActionMessageSchema.safeParse(message).success).toBe(false);
    },
  );

  it("rejects unknown message and nested payload fields", () => {
    const message = {
      protocolVersion: PROTOCOL_VERSION,
      type: "client.ping",
      payload: { nonce: "ping-001", unexpected: true },
    };

    expect(ClientMessageSchema.safeParse(message).success).toBe(false);
  });

  it("rejects control characters in ping nonces", () => {
    const message = {
      protocolVersion: PROTOCOL_VERSION,
      type: "client.ping",
      payload: { nonce: "ping-001\nforged-log-line" },
    };

    expect(ClientMessageSchema.safeParse(message).success).toBe(false);
  });

  it("rejects incompatible protocol versions and unsafe revisions", () => {
    const incompatible = {
      protocolVersion: 2,
      type: "client.hello",
      payload: {},
    };
    const unsafe = {
      protocolVersion: PROTOCOL_VERSION,
      type: "client.action",
      payload: {
        actionId: "action-001",
        expectedRevision: Number.MAX_SAFE_INTEGER + 1,
        intent: { action: "door.close", doorId: "c03" },
      },
    };

    expect(ClientMessageSchema.safeParse(incompatible).success).toBe(false);
    expect(ClientMessageSchema.safeParse(unsafe).success).toBe(false);
  });

  it("rejects mismatched snapshot and projection revisions", () => {
    const inconsistent = {
      protocolVersion: PROTOCOL_VERSION,
      type: "server.snapshot",
      payload: {
        revision: 2,
        projection: {
          role: "archives",
          revision: 1,
          doorRecord: {
            id: "c03",
            label: "DOOR C03",
            status: "SEALED",
            since: "11 YEARS",
          },
          updates: [],
        },
      },
    };

    expect(ServerMessageSchema.safeParse(inconsistent).success).toBe(false);
  });
});

describe("version 1 server protocol", () => {
  it.each([
    {
      protocolVersion: PROTOCOL_VERSION,
      type: "server.welcome",
      payload: { revision: 0, heartbeatIntervalMs: 15_000 },
    },
    {
      protocolVersion: PROTOCOL_VERSION,
      type: "server.snapshot",
      payload: {
        revision: 0,
        projection: {
          role: "operations",
          revision: 0,
          door: { id: "c03", label: "DOOR C03", status: "OPEN" },
        },
      },
    },
    {
      protocolVersion: PROTOCOL_VERSION,
      type: "server.error",
      payload: {
        code: "STALE_REVISION",
        message: "The action is based on an old revision.",
        revision: 3,
        actionId: "action-001",
      },
    },
    {
      protocolVersion: PROTOCOL_VERSION,
      type: "server.pong",
      payload: { nonce: "ping-001" },
    },
  ])("accepts $type", (message) => {
    expect(ServerMessageSchema.parse(message)).toEqual(message);
  });

  it("rejects arbitrary internal error text", () => {
    const message = {
      protocolVersion: PROTOCOL_VERSION,
      type: "server.error",
      payload: {
        code: "ACTION_REJECTED",
        message: "Database failed at postgresql://private-host/signal_lost",
      },
    };

    expect(ServerMessageSchema.safeParse(message).success).toBe(false);
  });
});
