# Scenario authoring

Scenarios are local, versioned, declarative data. They cannot execute JavaScript, load code from a URL, or import an unreviewed module.

## Validate a scenario

```text
pnpm scenario:validate
```

The validator checks schema structure, role identifiers, fact and projection references, supported intents, and scenario metadata. Reference and reachability checks will expand alongside the scenario language.

## Security boundary

Scenario files are server input. Complete mission sources contain spoilers and canonical truth, but those files are never included in the browser build. Runtime secrecy is enforced by server projections.

## Content rules

- Use fictional stations, people, organizations, and incidents.
- Do not include real personal data in fixtures or story records.
- Keep localization keys explicit and test missing translations.
- Every contradictory observation needs a declared cause.
- Every ending needs a reachable, testable condition.
