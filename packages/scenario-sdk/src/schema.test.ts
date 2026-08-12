import { describe, expect, it } from 'vitest';

import { scenarioSchema } from './schema.js';

const minimalScenario = {
  schemaVersion: 1,
  id: 'test-scenario',
  title: 'Test scenario',
  status: 'vertical-slice',
  roles: [
    {
      id: 'operations',
      displayName: 'Operations',
      operatorId: 'OPERATIONS-01',
      briefing: 'Operate the door.',
    },
    {
      id: 'archives',
      displayName: 'Archives',
      operatorId: 'ARCHIVES-01',
      briefing: 'Read the record.',
    },
  ],
  initial: { caseId: 'C03', factIds: ['door-c03'] },
  facts: [
    {
      id: 'door-c03',
      subject: 'Door C03',
      canonical: { serverOnly: true, value: 'open' },
      projections: [
        { roleId: 'operations', text: 'DOOR C03: OPEN' },
        { roleId: 'archives', text: 'DOOR C03: SEALED' },
      ],
    },
  ],
  actions: [],
} as const;

describe('scenarioSchema', () => {
  it('accepts a declarative scenario with role-specific projections', () => {
    expect(scenarioSchema.parse(minimalScenario)).toEqual(minimalScenario);
  });

  it('rejects executable or otherwise unknown fields', () => {
    expect(() =>
      scenarioSchema.parse({
        ...minimalScenario,
        execute: 'process.exit(1)',
      }),
    ).toThrow();
  });

  it('rejects references to undeclared roles', () => {
    const invalid = {
      ...minimalScenario,
      facts: minimalScenario.facts.map((fact, factIndex) => ({
        ...fact,
        projections: fact.projections.map((projection, projectionIndex) =>
          factIndex === 0 && projectionIndex === 0
            ? { ...projection, roleId: 'intruder' }
            : projection,
        ),
      })),
    };

    expect(() => scenarioSchema.parse(invalid)).toThrow(/unknown role id/);
  });

  it('rejects unsupported action intents', () => {
    const invalid = {
      ...minimalScenario,
      actions: [
        {
          id: 'close-c03',
          actorRoleId: 'operations',
          intent: 'execute-arbitrary-action',
          targetFactId: 'door-c03',
          canonicalDecision: { factId: 'door-c03', value: 'closed' },
          projectionUpdates: [
            { roleId: 'operations', text: 'DOOR C03: CLOSED' },
          ],
        },
      ],
    };

    expect(() => scenarioSchema.parse(invalid)).toThrow();
  });
});
