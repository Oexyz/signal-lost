#!/usr/bin/env node

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ZodError } from 'zod';

import { loadScenario } from './loader.js';

const USAGE = 'Usage: signal-lost-scenario validate <scenario-directory-or-yaml>';

function renderValidationError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const location = issue.path.length > 0 ? issue.path.join('.') : '<root>';
      return `${location}: ${issue.message}`;
    })
    .join('\n');
}

export async function main(args = process.argv.slice(2)): Promise<number> {
  const [command, scenarioPath, ...extra] = args;
  if (command !== 'validate' || scenarioPath === undefined || extra.length > 0) {
    console.error(USAGE);
    return 2;
  }

  try {
    const scenario = await loadScenario(scenarioPath);
    console.log(`Valid scenario: ${scenario.title} (${scenario.id})`);
    return 0;
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(`Invalid scenario:\n${renderValidationError(error)}`);
    } else {
      const message = error instanceof Error ? error.message : 'unknown validation error';
      console.error(`Invalid scenario: ${message}`);
    }
    return 1;
  }
}

export function isDirectExecution(
  moduleUrl: string,
  executablePath: string | undefined,
): boolean {
  return executablePath !== undefined &&
    moduleUrl === pathToFileURL(resolve(executablePath)).href;
}

if (isDirectExecution(import.meta.url, process.argv[1])) {
  process.exitCode = await main();
}
