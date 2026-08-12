import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  applyIntent,
  createInitialState,
  isSafeRevision,
  projectState,
} from "../src/index.js";

const actionIdArbitrary = fc
  .stringMatching(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,31}$/)
  .filter((value) => value.length > 0);

describe("engine properties and projection leak sentinels", () => {
  it("is deterministic for identical state, intent, and authority", () => {
    fc.assert(
      fc.property(actionIdArbitrary, fc.string(), (actionId, seed) => {
        const state = createInitialState({ seed });
        const payload = {
          actionId,
          expectedRevision: state.revision,
          intent: { action: "door.close", doorId: "c03" },
        } as const;

        expect(applyIntent(state, payload, { role: "operations" })).toEqual(
          applyIntent(state, payload, { role: "operations" }),
        );
      }),
    );
  });

  it("keeps every produced revision monotonic and safely representable", () => {
    fc.assert(
      fc.property(actionIdArbitrary, (actionId) => {
        const state = createInitialState();
        const result = applyIntent(
          state,
          {
            actionId,
            expectedRevision: state.revision,
            intent: { action: "door.close", doorId: "c03" },
          },
          { role: "operations" },
        );

        expect(result.ok).toBe(true);
        expect(result.state.revision).toBeGreaterThanOrEqual(state.revision);
        expect(isSafeRevision(result.state.revision)).toBe(true);
      }),
    );
  });

  it("never grants Archives an Operations capability", () => {
    fc.assert(
      fc.property(actionIdArbitrary, (actionId) => {
        const state = createInitialState();
        const result = applyIntent(
          state,
          {
            actionId,
            expectedRevision: 0,
            intent: { action: "door.close", doorId: "c03" },
          },
          { role: "archives" },
        );

        expect(result.ok).toBe(false);
        expect(result.state).toBe(state);
        expect(result.state.processedActionIds).toHaveLength(0);
        expect(result.state.archiveEvents).toHaveLength(0);
      }),
    );
  });

  it("never serializes seed, drift, secret truth, or internal events to either role", () => {
    fc.assert(
      fc.property(actionIdArbitrary, fc.string(), (actionId, seed) => {
        const initial = createInitialState({
          seed: `leak-sentinel-${seed}-station_core`,
        });
        const applied = applyIntent(
          initial,
          {
            actionId,
            expectedRevision: 0,
            intent: { action: "door.close", doorId: "c03" },
          },
          { role: "operations" },
        );
        const state = applied.state;

        for (const role of ["operations", "archives"] as const) {
          const serialized = JSON.stringify(projectState(state, role));
          expect(serialized).not.toContain("leak-sentinel-");
          expect(serialized).not.toContain("station_core");
          expect(serialized).not.toContain("secret");
          expect(serialized).not.toContain("drift");
          expect(serialized).not.toContain("operations.close-recorded");
          expect(serialized).not.toContain("processedActionIds");
        }
      }),
    );
  });
});
