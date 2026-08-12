import type { FastifyInstance } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { installGracefulShutdown } from './runtime.js';

function fakeServer(close: () => Promise<void>): FastifyInstance {
  return {
    addHook: vi.fn(),
    close,
    log: { error: vi.fn() },
  } as unknown as FastifyInstance;
}

describe('graceful shutdown', () => {
  it('closes once when stop is requested repeatedly', async () => {
    const close = vi.fn(() => Promise.resolve());
    const controller = installGracefulShutdown(fakeServer(close), {
      listenForSignals: false,
      timeoutMs: 100,
    });

    await Promise.all([controller.stop(), controller.stop('SIGTERM')]);
    expect(close).toHaveBeenCalledOnce();
  });

  it('rejects when closing exceeds the deadline', async () => {
    const controller = installGracefulShutdown(
      fakeServer(() => new Promise<void>(() => undefined)),
      { listenForSignals: false, timeoutMs: 10 },
    );

    await expect(controller.stop()).rejects.toThrow('graceful shutdown timed out');
  });
});
