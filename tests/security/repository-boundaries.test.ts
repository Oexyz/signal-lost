import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

function sourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(?:css|html|js|jsx|mjs|ts|tsx)$/u.test(path) ? [path] : [];
  });
}

describe('repository boundaries', () => {
  it('keeps repository instructions out of the public root', () => {
    expect(existsSync(join(root, 'AGENTS.md'))).toBe(false);

    const tracked = execFileSync('git', ['ls-files'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split(/\r?\n/u)
      .filter(Boolean);

    expect(tracked).not.toContain('AGENTS.md');
  });

  it('prevents the browser package from importing server-only state', () => {
    const webFiles = sourceFiles(join(root, 'apps/web'));
    const source = webFiles.map((path) => readFileSync(path, 'utf8')).join('\n');

    expect(source).not.toMatch(/@signal-lost\/game-engine/u);
    expect(source).not.toMatch(/scenarios\/orpheus-17/u);
    expect(source).not.toMatch(/station_core|processedActionIds|operations\.close-recorded/u);
  });
});
