import type { FastifyInstance } from 'fastify';

export type ServerEnvironment = 'development' | 'production' | 'test';

export interface OriginPolicyOptions {
  readonly environment: ServerEnvironment;
  readonly allowedOrigins: readonly string[];
}

const SECURITY_HEADERS = {
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
} as const;

function normalizeOrigin(origin: string): string | undefined {
  try {
    const url = new URL(origin);
    if (url.origin !== origin || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
      return undefined;
    }
    return url.origin;
  } catch {
    return undefined;
  }
}

export function isOriginAllowed(
  origin: string,
  options: OriginPolicyOptions,
): boolean {
  const normalized = normalizeOrigin(origin);
  if (normalized === undefined) {
    return false;
  }

  if (options.allowedOrigins.includes(normalized)) {
    return true;
  }

  if (options.environment === 'production') {
    return false;
  }

  const url = new URL(normalized);
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
}

export function registerSecurityHooks(
  server: FastifyInstance,
  options: OriginPolicyOptions,
): void {
  server.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;
    if (origin === undefined) {
      return;
    }

    if (!isOriginAllowed(origin, options)) {
      await reply.code(403).send({ error: 'origin_not_allowed' });
      return reply;
    }

    void reply.header('access-control-allow-origin', origin);
    void reply.header('vary', 'Origin');
  });

  server.addHook('onSend', async (_request, reply, payload) => {
    void reply.header('cache-control', 'no-store');
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      void reply.header(name, value);
    }
    return payload;
  });
}
