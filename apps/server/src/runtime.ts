import type { FastifyInstance } from 'fastify';

export interface ShutdownController {
  readonly stop: (signal?: NodeJS.Signals) => Promise<void>;
}

export interface GracefulShutdownOptions {
  readonly forceExit?: (code: number) => never | void;
  readonly listenForSignals?: boolean;
  readonly timeoutMs?: number;
}

const DEFAULT_SHUTDOWN_TIMEOUT_MS = 8_000;

async function closeWithDeadline(
  server: FastifyInstance,
  timeoutMs: number,
): Promise<void> {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) {
    throw new Error('shutdown timeout must be an integer between 1 and 30000');
  }

  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      Promise.resolve().then(async () => server.close()),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('graceful shutdown timed out')),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export function installGracefulShutdown(
  server: FastifyInstance,
  options: GracefulShutdownOptions = {},
): ShutdownController {
  let stopping: Promise<void> | undefined;
  const timeoutMs = options.timeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS;
  const listenForSignals = options.listenForSignals ?? true;
  const forceExit = options.forceExit ?? ((code: number) => process.exit(code));

  const stop = async (_signal?: NodeJS.Signals): Promise<void> => {
    void _signal;
    stopping ??= closeWithDeadline(server, timeoutMs);
    await stopping;
  };

  const onSignal = (signal: NodeJS.Signals): void => {
    void stop(signal)
      .then(() => {
        process.exitCode = 0;
      })
      .catch(() => {
        server.log.error('graceful shutdown failed');
        forceExit(1);
      });
  };

  if (listenForSignals) {
    process.once('SIGINT', onSignal);
    process.once('SIGTERM', onSignal);
  }

  server.addHook('onClose', () => {
    if (listenForSignals) {
      process.removeListener('SIGINT', onSignal);
      process.removeListener('SIGTERM', onSignal);
    }
  });

  return { stop };
}
