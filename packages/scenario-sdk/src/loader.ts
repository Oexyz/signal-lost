import { readFile, stat } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { parseDocument } from 'yaml';

import { scenarioSchema, type Scenario } from './schema.js';

const MAX_SCENARIO_BYTES = 256 * 1024;
const SCENARIO_FILENAMES = ['scenario.yaml', 'scenario.yml'] as const;

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function findWorkspaceRoot(start: string): Promise<string | undefined> {
  let candidate = resolve(start);

  for (;;) {
    if (await isFile(join(candidate, 'pnpm-workspace.yaml'))) {
      return candidate;
    }
    const parent = resolve(candidate, '..');
    if (parent === candidate) {
      return undefined;
    }
    candidate = parent;
  }
}

async function expandScenarioPath(path: string): Promise<string | undefined> {
  if (await isFile(path)) {
    return path;
  }
  if (!(await isDirectory(path))) {
    return undefined;
  }

  for (const filename of SCENARIO_FILENAMES) {
    const candidate = join(path, filename);
    if (await isFile(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

export async function resolveScenarioPath(
  input: string,
  cwd = process.cwd(),
): Promise<string> {
  const candidates = isAbsolute(input) ? [input] : [resolve(cwd, input)];
  const workspaceRoot = await findWorkspaceRoot(cwd);

  if (workspaceRoot !== undefined && !isAbsolute(input)) {
    const workspaceCandidate = resolve(workspaceRoot, input);
    if (!candidates.includes(workspaceCandidate)) {
      candidates.push(workspaceCandidate);
    }
  }

  for (const candidate of candidates) {
    const expanded = await expandScenarioPath(candidate);
    if (expanded !== undefined) {
      return expanded;
    }
  }

  throw new Error('scenario path does not contain scenario.yaml or scenario.yml');
}

export async function loadScenarioFile(path: string): Promise<Scenario> {
  const metadata = await stat(path);
  if (metadata.size > MAX_SCENARIO_BYTES) {
    throw new Error(`scenario file exceeds ${String(MAX_SCENARIO_BYTES)} bytes`);
  }

  const source = await readFile(path, 'utf8');
  const document = parseDocument(source, {
    schema: 'core',
    uniqueKeys: true,
  });

  if (document.errors.length > 0) {
    throw new Error(document.errors.map((error) => error.message).join('; '));
  }

  const data: unknown = document.toJS({ maxAliasCount: 0 });
  return scenarioSchema.parse(data);
}

export async function loadScenario(
  input: string,
  cwd = process.cwd(),
): Promise<Scenario> {
  return loadScenarioFile(await resolveScenarioPath(input, cwd));
}
