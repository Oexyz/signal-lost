import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

import { isDirectExecution, main } from './cli.js';

describe('scenario CLI', () => {
  it('detects direct execution using a platform-safe file URL', () => {
    const executable = resolve('dist/cli.js');
    expect(isDirectExecution(pathToFileURL(executable).href, executable)).toBe(true);
    expect(isDirectExecution('file:///different.js', executable)).toBe(false);
  });

  it('returns a failure for a missing scenario path', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await expect(main(['validate', 'definitely-not-a-scenario'])).resolves.toBe(1);
    } finally {
      error.mockRestore();
    }
  });
});
