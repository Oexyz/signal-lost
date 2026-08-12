import websocket from '@fastify/websocket';
import { createInitialState, projectState } from '@signal-lost/game-engine';
import { PROTOCOL_VERSION, RoleProjectionSchema } from '@signal-lost/protocol';
import Fastify, {
  type FastifyBaseLogger,
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';

import {
  registerSecurityHooks,
  type ServerEnvironment,
} from './security.js';

export type ReadinessProbe = () => boolean | Promise<boolean>;

export interface BuildServerOptions {
  readonly readinessProbe?: ReadinessProbe;
  readonly readinessTimeoutMs?: number;
  readonly environment?: ServerEnvironment;
  readonly allowedOrigins?: readonly string[];
  readonly logger?: FastifyServerOptions['logger'];
}

const BODY_LIMIT_BYTES = 16 * 1024;
const DEFAULT_READINESS_TIMEOUT_MS = 1_000;

async function probeWithTimeout(
  readinessProbe: ReadinessProbe,
  timeoutMs: number,
): Promise<boolean> {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10_000) {
    throw new Error('readinessTimeoutMs must be an integer between 1 and 10000');
  }

  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(readinessProbe),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('readiness probe timed out')),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function inferEnvironment(value: string | undefined): ServerEnvironment {
  if (value === 'production' || value === 'test') {
    return value;
  }
  return 'development';
}

export function localFoundationReadiness(): boolean {
  if (PROTOCOL_VERSION !== 1) {
    return false;
  }

  const state = createInitialState();
  return (
    RoleProjectionSchema.safeParse(projectState(state, 'operations')).success &&
    RoleProjectionSchema.safeParse(projectState(state, 'archives')).success
  );
}

export async function buildServer(
  options: BuildServerOptions = {},
): Promise<FastifyInstance> {
  const server = Fastify({
    bodyLimit: BODY_LIMIT_BYTES,
    connectionTimeout: 10_000,
    keepAliveTimeout: 5_000,
    logger: options.logger ?? false,
    requestTimeout: 10_000,
    routerOptions: {
      maxParamLength: 100,
    },
    trustProxy: false,
  });

  registerSecurityHooks(server, {
    environment: options.environment ?? inferEnvironment(process.env.NODE_ENV),
    allowedOrigins: options.allowedOrigins ?? [],
  });

  await server.register(websocket, {
    options: {
      maxPayload: BODY_LIMIT_BYTES,
    },
  });

  server.get('/health/live', async (_request, reply) => {
    return reply.code(200).send({ status: 'ok' });
  });

  const readinessProbe = options.readinessProbe ?? localFoundationReadiness;
  const readinessTimeoutMs =
    options.readinessTimeoutMs ?? DEFAULT_READINESS_TIMEOUT_MS;
  server.get('/health/ready', async (_request, reply) => {
    try {
      if (await probeWithTimeout(readinessProbe, readinessTimeoutMs)) {
        return reply.code(200).send({ status: 'ok' });
      }
    } catch {
      server.log.warn('readiness probe failed');
    }

    return reply.code(503).send({ status: 'unavailable' });
  });

  return server;
}

export type { FastifyBaseLogger };
