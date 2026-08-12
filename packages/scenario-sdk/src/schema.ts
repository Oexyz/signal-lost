import { z } from 'zod';

const idSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9-]*$/, 'must be a lowercase kebab-case identifier');

const displayTextSchema = z.string().min(1).max(2_000);

export const roleSchema = z
  .object({
    id: idSchema,
    displayName: z.string().min(1).max(80),
    operatorId: z.string().min(1).max(80),
    briefing: displayTextSchema,
  })
  .strict();

export const projectionSchema = z
  .object({
    roleId: idSchema,
    text: displayTextSchema,
  })
  .strict();

export const factSchema = z
  .object({
    id: idSchema,
    subject: z.string().min(1).max(120),
    canonical: z
      .object({
        serverOnly: z.literal(true),
        value: displayTextSchema,
      })
      .strict(),
    projections: z.array(projectionSchema).min(1).max(16),
  })
  .strict();

export const actionSchema = z
  .object({
    id: idSchema,
    actorRoleId: idSchema,
    intent: z.literal('door.close'),
    targetFactId: idSchema,
    canonicalDecision: z
      .object({
        factId: idSchema,
        value: displayTextSchema,
      })
      .strict(),
    projectionUpdates: z.array(projectionSchema).min(1).max(16),
  })
  .strict();

export const scenarioSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: idSchema,
    title: z.string().min(1).max(120),
    status: z.literal('vertical-slice'),
    roles: z.array(roleSchema).min(2).max(16),
    initial: z
      .object({
        caseId: z
          .string()
          .min(1)
          .max(32)
          .regex(/^[A-Z][A-Z0-9-]*$/, 'must be an uppercase case identifier'),
        factIds: z.array(idSchema).min(1).max(128),
      })
      .strict(),
    facts: z.array(factSchema).min(1).max(128),
    actions: z.array(actionSchema).max(128),
  })
  .strict()
  .superRefine((scenario, context) => {
    const roleIds = new Set<string>();
    const factIds = new Set<string>();
    const actionIds = new Set<string>();

    scenario.roles.forEach((role, index) => {
      if (roleIds.has(role.id)) {
        context.addIssue({
          code: 'custom',
          message: `duplicate role id: ${role.id}`,
          path: ['roles', index, 'id'],
        });
      }
      roleIds.add(role.id);
    });

    scenario.facts.forEach((fact, factIndex) => {
      if (factIds.has(fact.id)) {
        context.addIssue({
          code: 'custom',
          message: `duplicate fact id: ${fact.id}`,
          path: ['facts', factIndex, 'id'],
        });
      }
      factIds.add(fact.id);

      const projectedRoleIds = new Set<string>();
      fact.projections.forEach((projection, projectionIndex) => {
        if (!roleIds.has(projection.roleId)) {
          context.addIssue({
            code: 'custom',
            message: `unknown role id: ${projection.roleId}`,
            path: ['facts', factIndex, 'projections', projectionIndex, 'roleId'],
          });
        }
        if (projectedRoleIds.has(projection.roleId)) {
          context.addIssue({
            code: 'custom',
            message: `duplicate projection for role: ${projection.roleId}`,
            path: ['facts', factIndex, 'projections', projectionIndex, 'roleId'],
          });
        }
        projectedRoleIds.add(projection.roleId);
      });
    });

    scenario.initial.factIds.forEach((factId, index) => {
      if (!factIds.has(factId)) {
        context.addIssue({
          code: 'custom',
          message: `unknown initial fact id: ${factId}`,
          path: ['initial', 'factIds', index],
        });
      }
    });

    scenario.actions.forEach((action, actionIndex) => {
      if (actionIds.has(action.id)) {
        context.addIssue({
          code: 'custom',
          message: `duplicate action id: ${action.id}`,
          path: ['actions', actionIndex, 'id'],
        });
      }
      actionIds.add(action.id);

      if (!roleIds.has(action.actorRoleId)) {
        context.addIssue({
          code: 'custom',
          message: `unknown actor role id: ${action.actorRoleId}`,
          path: ['actions', actionIndex, 'actorRoleId'],
        });
      }
      if (!factIds.has(action.targetFactId)) {
        context.addIssue({
          code: 'custom',
          message: `unknown target fact id: ${action.targetFactId}`,
          path: ['actions', actionIndex, 'targetFactId'],
        });
      }
      if (action.canonicalDecision.factId !== action.targetFactId) {
        context.addIssue({
          code: 'custom',
          message: 'canonical decision must address the target fact',
          path: ['actions', actionIndex, 'canonicalDecision', 'factId'],
        });
      }

      const updateRoleIds = new Set<string>();
      action.projectionUpdates.forEach((projection, projectionIndex) => {
        if (!roleIds.has(projection.roleId)) {
          context.addIssue({
            code: 'custom',
            message: `unknown role id: ${projection.roleId}`,
            path: [
              'actions',
              actionIndex,
              'projectionUpdates',
              projectionIndex,
              'roleId',
            ],
          });
        }
        if (updateRoleIds.has(projection.roleId)) {
          context.addIssue({
            code: 'custom',
            message: `duplicate update for role: ${projection.roleId}`,
            path: [
              'actions',
              actionIndex,
              'projectionUpdates',
              projectionIndex,
              'roleId',
            ],
          });
        }
        updateRoleIds.add(projection.roleId);
      });
    });
  });

export type Scenario = z.infer<typeof scenarioSchema>;
