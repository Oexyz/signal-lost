import { z } from "zod";

export const PROTOCOL_VERSION = 1 as const;

export const ProtocolVersionSchema = z.literal(PROTOCOL_VERSION);

export const RevisionSchema = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER);

export const ActionIdSchema = z
  .string()
  .min(1)
  .max(96)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);

export const PingNonceSchema = z
  .string()
  .min(1)
  .max(96)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);

export const RoleSchema = z.enum(["operations", "archives"]);
export type Role = z.infer<typeof RoleSchema>;

export const DoorIdSchema = z.literal("c03");
export type DoorId = z.infer<typeof DoorIdSchema>;

export const DoorCloseIntentSchema = z.strictObject({
  action: z.literal("door.close"),
  doorId: DoorIdSchema,
});

export const ActionIntentSchema = DoorCloseIntentSchema;
export type ActionIntent = z.infer<typeof ActionIntentSchema>;

export const OperationsProjectionSchema = z.strictObject({
  role: z.literal("operations"),
  revision: RevisionSchema,
  door: z.strictObject({
    id: DoorIdSchema,
    label: z.literal("DOOR C03"),
    status: z.enum(["OPEN", "CLOSED"]),
  }),
});

export type OperationsProjection = z.infer<
  typeof OperationsProjectionSchema
>;

export const ArchiveUpdateSchema = z.strictObject({
  headline: z.literal("ARCHIVE UPDATE"),
  detail: z.literal("This record was modified 4 seconds ago."),
  author: z.literal("OPERATIONS-01"),
  created: z.literal("11 YEARS AGO"),
});

export type ArchiveUpdate = z.infer<typeof ArchiveUpdateSchema>;

export const ArchivesProjectionSchema = z.strictObject({
  role: z.literal("archives"),
  revision: RevisionSchema,
  doorRecord: z.strictObject({
    id: DoorIdSchema,
    label: z.literal("DOOR C03"),
    status: z.literal("SEALED"),
    since: z.literal("11 YEARS"),
  }),
  updates: z.array(ArchiveUpdateSchema),
});

export type ArchivesProjection = z.infer<typeof ArchivesProjectionSchema>;

export const RoleProjectionSchema = z.discriminatedUnion("role", [
  OperationsProjectionSchema,
  ArchivesProjectionSchema,
]);

export type RoleProjection = z.infer<typeof RoleProjectionSchema>;

export const ClientHelloPayloadSchema = z.strictObject({
  lastSeenRevision: RevisionSchema.optional(),
});

export const ClientHelloMessageSchema = z.strictObject({
  protocolVersion: ProtocolVersionSchema,
  type: z.literal("client.hello"),
  payload: ClientHelloPayloadSchema,
});

export type ClientHelloMessage = z.infer<typeof ClientHelloMessageSchema>;

export const ClientActionPayloadSchema = z.strictObject({
  actionId: ActionIdSchema,
  expectedRevision: RevisionSchema,
  intent: ActionIntentSchema,
});

export type ClientActionPayload = z.infer<typeof ClientActionPayloadSchema>;

export const ClientActionMessageSchema = z.strictObject({
  protocolVersion: ProtocolVersionSchema,
  type: z.literal("client.action"),
  payload: ClientActionPayloadSchema,
});

export type ClientActionMessage = z.infer<typeof ClientActionMessageSchema>;

export const ClientPingPayloadSchema = z.strictObject({
  nonce: PingNonceSchema,
});

export const ClientPingMessageSchema = z.strictObject({
  protocolVersion: ProtocolVersionSchema,
  type: z.literal("client.ping"),
  payload: ClientPingPayloadSchema,
});

export type ClientPingMessage = z.infer<typeof ClientPingMessageSchema>;

export const ClientMessageSchema = z.discriminatedUnion("type", [
  ClientHelloMessageSchema,
  ClientActionMessageSchema,
  ClientPingMessageSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

export const ServerWelcomePayloadSchema = z.strictObject({
  revision: RevisionSchema,
  heartbeatIntervalMs: z.number().int().min(1_000).max(120_000),
});

export const ServerWelcomeMessageSchema = z.strictObject({
  protocolVersion: ProtocolVersionSchema,
  type: z.literal("server.welcome"),
  payload: ServerWelcomePayloadSchema,
});

export type ServerWelcomeMessage = z.infer<typeof ServerWelcomeMessageSchema>;

export const ServerSnapshotPayloadSchema = z
  .strictObject({
    revision: RevisionSchema,
    projection: RoleProjectionSchema,
  })
  .refine((payload) => payload.revision === payload.projection.revision, {
    message: "Snapshot and projection revisions must match.",
    path: ["projection", "revision"],
  });

export const ServerSnapshotMessageSchema = z.strictObject({
  protocolVersion: ProtocolVersionSchema,
  type: z.literal("server.snapshot"),
  payload: ServerSnapshotPayloadSchema,
});

export type ServerSnapshotMessage = z.infer<typeof ServerSnapshotMessageSchema>;

export const ServerErrorCodeSchema = z.enum([
  "ACTION_REJECTED",
  "DUPLICATE_ACTION",
  "INVALID_MESSAGE",
  "REVISION_EXHAUSTED",
  "ROLE_NOT_ALLOWED",
  "STALE_REVISION",
]);

export type ServerErrorCode = z.infer<typeof ServerErrorCodeSchema>;

export const ServerErrorTextSchema = z.enum([
  "The action has already been processed.",
  "The action is based on an old revision.",
  "The action payload is invalid.",
  "The canonical revision is invalid.",
  "The room revision limit has been reached.",
  "This role cannot control bulkhead C03.",
  "Bulkhead C03 is already shown as closed.",
]);

export type ServerErrorText = z.infer<typeof ServerErrorTextSchema>;

export const ServerErrorPayloadSchema = z.strictObject({
  code: ServerErrorCodeSchema,
  message: ServerErrorTextSchema,
  revision: RevisionSchema.optional(),
  actionId: ActionIdSchema.optional(),
});

export const ServerErrorMessageSchema = z.strictObject({
  protocolVersion: ProtocolVersionSchema,
  type: z.literal("server.error"),
  payload: ServerErrorPayloadSchema,
});

export type ServerErrorMessage = z.infer<typeof ServerErrorMessageSchema>;

export const ServerPongPayloadSchema = z.strictObject({
  nonce: PingNonceSchema,
});

export const ServerPongMessageSchema = z.strictObject({
  protocolVersion: ProtocolVersionSchema,
  type: z.literal("server.pong"),
  payload: ServerPongPayloadSchema,
});

export type ServerPongMessage = z.infer<typeof ServerPongMessageSchema>;

export const ServerMessageSchema = z.discriminatedUnion("type", [
  ServerWelcomeMessageSchema,
  ServerSnapshotMessageSchema,
  ServerErrorMessageSchema,
  ServerPongMessageSchema,
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;

export const clientHelloSchema = ClientHelloMessageSchema;
export const clientActionSchema = ClientActionMessageSchema;
export const clientPingSchema = ClientPingMessageSchema;
export const clientMessageSchema = ClientMessageSchema;
export const serverWelcomeSchema = ServerWelcomeMessageSchema;
export const serverSnapshotSchema = ServerSnapshotMessageSchema;
export const serverErrorSchema = ServerErrorMessageSchema;
export const serverPongSchema = ServerPongMessageSchema;
export const serverMessageSchema = ServerMessageSchema;

export function parseClientMessage(input: unknown): ClientMessage {
  return ClientMessageSchema.parse(input);
}

export function parseServerMessage(input: unknown): ServerMessage {
  return ServerMessageSchema.parse(input);
}
