import { describe, expect, it } from "vitest";
import type { Role } from "@signal-lost/protocol";

import { applyIntent, createInitialState, projectState } from "../src/index.js";

const closeC03 = {
  actionId: "action-001",
  expectedRevision: 0,
  intent: { action: "door.close", doorId: "c03" },
} as const;

describe("C03 vertical slice", () => {
  it("starts with one canonical truth and contradictory role projections", () => {
    const state = createInitialState({ seed: "server-only-seed" });

    expect(state.world.doors.c03.state).toBe("closed");
    expect(projectState(state, "operations")).toEqual({
      role: "operations",
      revision: 0,
      door: { id: "c03", label: "DOOR C03", status: "OPEN" },
    });
    expect(projectState(state, "archives")).toEqual({
      role: "archives",
      revision: 0,
      doorRecord: {
        id: "c03",
        label: "DOOR C03",
        status: "SEALED",
        since: "11 YEARS",
      },
      updates: [],
    });
  });

  it("records an authorized close and publishes an Archives update", () => {
    const initial = createInitialState();
    const result = applyIntent(initial, closeC03, { role: "operations" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(initial.revision).toBe(0);
    expect(result.state.revision).toBe(1);
    expect(result.state.world.doors.c03.state).toBe("closed");
    expect(projectState(result.state, "operations").door.status).toBe("CLOSED");
    expect(projectState(result.state, "archives").updates).toEqual([
      {
        headline: "ARCHIVE UPDATE",
        detail: "This record was modified 4 seconds ago.",
        author: "OPERATIONS-01",
        created: "11 YEARS AGO",
      },
    ]);
  });

  it("rejects Archives control without changing canonical state", () => {
    const initial = createInitialState();
    const result = applyIntent(initial, closeC03, { role: "archives" });

    expect(result).toMatchObject({
      ok: false,
      state: initial,
      error: { code: "ROLE_NOT_ALLOWED", revision: 0 },
    });
    expect(result.state).toBe(initial);
  });

  it("rejects both replayed action IDs and stale revisions", () => {
    const first = applyIntent(createInitialState(), closeC03, {
      role: "operations",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const replay = applyIntent(first.state, closeC03, { role: "operations" });
    expect(replay.ok).toBe(false);
    if (replay.ok) return;
    expect(replay.error.code).toBe("DUPLICATE_ACTION");
    expect(replay.state).toBe(first.state);

    const stale = applyIntent(
      first.state,
      { ...closeC03, actionId: "action-002" },
      { role: "operations" },
    );
    expect(stale.ok).toBe(false);
    if (stale.ok) return;
    expect(stale.error.code).toBe("STALE_REVISION");
    expect(stale.state).toBe(first.state);
  });

  it("fails closed for an invalid runtime projection role", () => {
    expect(() =>
      projectState(createInitialState(), "intruder" as Role),
    ).toThrow("Unsupported projection role.");
  });

  it("omits an invalid canonical revision from public errors", () => {
    const state = { ...createInitialState(), revision: Number.NaN };
    const result = applyIntent(state, closeC03, { role: "operations" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual({
      code: "ACTION_REJECTED",
      message: "The canonical revision is invalid.",
    });
  });
});
