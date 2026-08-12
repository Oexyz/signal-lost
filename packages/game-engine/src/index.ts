import {
  ClientActionPayloadSchema,
  type ArchiveUpdate,
  type ArchivesProjection,
  type ClientActionPayload,
  type OperationsProjection,
  type Role,
  type RoleProjection,
  type ServerErrorText,
} from "@signal-lost/protocol";

export const C03_SCENARIO_ID = "orpheus-17:c03-vertical-slice" as const;

export type CanonicalDoorState = "open" | "closed";

export interface CanonicalArchiveEvent {
  readonly kind: "operations.close-recorded";
  readonly revision: number;
}

export interface CanonicalState {
  readonly scenarioId: typeof C03_SCENARIO_ID;
  readonly revision: number;
  readonly world: {
    readonly doors: {
      readonly c03: {
        readonly state: CanonicalDoorState;
      };
    };
  };
  readonly archiveEvents: readonly CanonicalArchiveEvent[];
  readonly processedActionIds: readonly string[];
  readonly internal: {
    readonly seed: string;
    readonly drift: {
      readonly operationsC03: "open" | "closed";
    };
    readonly secret: {
      readonly truth: {
        readonly entity: "station_core";
      };
    };
  };
}

export interface CreateInitialStateOptions {
  readonly seed?: string;
}

export interface AuthorityContext {
  readonly role: Role;
}

export type EngineErrorCode =
  | "ACTION_REJECTED"
  | "DUPLICATE_ACTION"
  | "INVALID_MESSAGE"
  | "REVISION_EXHAUSTED"
  | "ROLE_NOT_ALLOWED"
  | "STALE_REVISION";

export interface EngineError {
  readonly code: EngineErrorCode;
  readonly message: ServerErrorText;
  readonly revision?: number;
  readonly actionId?: string;
}

export interface AppliedAction {
  readonly kind: "door.closed";
  readonly doorId: "c03";
  readonly revision: number;
}

export type ApplyIntentResult =
  | {
      readonly ok: true;
      readonly state: CanonicalState;
      readonly event: AppliedAction;
    }
  | {
      readonly ok: false;
      readonly state: CanonicalState;
      readonly error: EngineError;
    };

export function isSafeRevision(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

export function createInitialState(
  options: CreateInitialStateOptions = {},
): CanonicalState {
  return {
    scenarioId: C03_SCENARIO_ID,
    revision: 0,
    world: {
      doors: {
        c03: { state: "closed" },
      },
    },
    archiveEvents: [],
    processedActionIds: [],
    internal: {
      seed: options.seed ?? "c03-default-seed",
      drift: { operationsC03: "open" },
      secret: { truth: { entity: "station_core" } },
    },
  };
}

function reject(
  state: CanonicalState,
  code: EngineErrorCode,
  message: ServerErrorText,
  actionId?: string,
): ApplyIntentResult {
  return {
    ok: false,
    state,
    error: {
      code,
      message,
      ...(isSafeRevision(state.revision) ? { revision: state.revision } : {}),
      ...(actionId === undefined ? {} : { actionId }),
    },
  };
}

export function applyIntent(
  state: CanonicalState,
  payload: ClientActionPayload,
  authority: AuthorityContext,
): ApplyIntentResult {
  if (!isSafeRevision(state.revision)) {
    return reject(state, "ACTION_REJECTED", "The canonical revision is invalid.");
  }

  const parsed = ClientActionPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return reject(state, "INVALID_MESSAGE", "The action payload is invalid.");
  }

  const action = parsed.data;

  if (state.processedActionIds.includes(action.actionId)) {
    return reject(
      state,
      "DUPLICATE_ACTION",
      "The action has already been processed.",
      action.actionId,
    );
  }

  if (action.expectedRevision !== state.revision) {
    return reject(
      state,
      "STALE_REVISION",
      "The action is based on an old revision.",
      action.actionId,
    );
  }

  if (authority.role !== "operations") {
    return reject(
      state,
      "ROLE_NOT_ALLOWED",
      "This role cannot control bulkhead C03.",
      action.actionId,
    );
  }

  if (state.internal.drift.operationsC03 === "closed") {
    return reject(
      state,
      "ACTION_REJECTED",
      "Bulkhead C03 is already shown as closed.",
      action.actionId,
    );
  }

  if (state.revision === Number.MAX_SAFE_INTEGER) {
    return reject(
      state,
      "REVISION_EXHAUSTED",
      "The room revision limit has been reached.",
      action.actionId,
    );
  }

  const revision = state.revision + 1;
  const nextState: CanonicalState = {
    ...state,
    revision,
    world: {
      doors: {
        c03: { state: "closed" },
      },
    },
    archiveEvents: [
      ...state.archiveEvents,
      { kind: "operations.close-recorded", revision },
    ],
    processedActionIds: [...state.processedActionIds, action.actionId],
    internal: {
      ...state.internal,
      drift: { operationsC03: "closed" },
    },
  };

  return {
    ok: true,
    state: nextState,
    event: { kind: "door.closed", doorId: "c03", revision },
  };
}

function projectOperations(state: CanonicalState): OperationsProjection {
  return {
    role: "operations",
    revision: state.revision,
    door: {
      id: "c03",
      label: "DOOR C03",
      status:
        state.internal.drift.operationsC03 === "open" ? "OPEN" : "CLOSED",
    },
  };
}

function toArchiveUpdate(): ArchiveUpdate {
  return {
    headline: "ARCHIVE UPDATE",
    detail: "This record was modified 4 seconds ago.",
    author: "OPERATIONS-01",
    created: "11 YEARS AGO",
  };
}

function projectArchives(state: CanonicalState): ArchivesProjection {
  return {
    role: "archives",
    revision: state.revision,
    doorRecord: {
      id: "c03",
      label: "DOOR C03",
      status: "SEALED",
      since: "11 YEARS",
    },
    updates: state.archiveEvents.map(toArchiveUpdate),
  };
}

export function projectState(
  state: CanonicalState,
  role: "operations",
): OperationsProjection;
export function projectState(
  state: CanonicalState,
  role: "archives",
): ArchivesProjection;
export function projectState(
  state: CanonicalState,
  role: Role,
): RoleProjection;
export function projectState(
  state: CanonicalState,
  role: Role,
): RoleProjection {
  switch (role) {
    case "operations":
      return projectOperations(state);
    case "archives":
      return projectArchives(state);
    default:
      throw new Error("Unsupported projection role.");
  }
}
