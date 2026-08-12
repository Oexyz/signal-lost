import { afterEach, describe, expect, it } from 'vitest';

import { buildServer } from './app.js';

const servers: Awaited<ReturnType<typeof buildServer>>[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(async (server) => server.close()));
});

async function makeServer(
  ...args: Parameters<typeof buildServer>
): ReturnType<typeof buildServer> {
  const server = await buildServer(...args);
  servers.push(server);
  return server;
}

describe('health endpoints', () => {
  it('reports liveness with a stable minimal response', async () => {
    const server = await makeServer();
    const response = await server.inject({ method: 'GET', url: '/health/live' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('reports readiness when the injected probe succeeds', async () => {
    const server = await makeServer({ readinessProbe: () => true });
    const response = await server.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('reports unavailable when the injected probe returns false', async () => {
    const server = await makeServer({ readinessProbe: () => false });
    const response = await server.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'unavailable' });
  });

  it('does not leak details from a failed readiness probe', async () => {
    const sensitiveMarker = 'private-database-host.example';
    const server = await makeServer({
      readinessProbe: () => {
        throw new Error(sensitiveMarker);
      },
    });
    const response = await server.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'unavailable' });
    expect(response.body).not.toContain(sensitiveMarker);
  });

  it('bounds a readiness probe that never settles', async () => {
    const server = await makeServer({
      readinessProbe: () => new Promise<boolean>(() => undefined),
      readinessTimeoutMs: 10,
    });
    const started = performance.now();
    const response = await server.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'unavailable' });
    expect(performance.now() - started).toBeLessThan(500);
  });

  it('sets no-store and restrictive response headers', async () => {
    const server = await makeServer();
    const response = await server.inject({ method: 'GET', url: '/health/live' });

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
    expect(response.headers['cross-origin-resource-policy']).toBe('same-origin');
    expect(response.headers['permissions-policy']).toContain('camera=()');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });
});

describe('origin policy', () => {
  it('rejects an untrusted browser origin in production', async () => {
    const server = await makeServer({
      environment: 'production',
      allowedOrigins: ['https://signal-lost.example'],
    });
    const response = await server.inject({
      method: 'GET',
      url: '/health/live',
      headers: { origin: 'https://attacker.example' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'origin_not_allowed' });
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('allows a configured production origin', async () => {
    const origin = 'https://signal-lost.example';
    const server = await makeServer({
      environment: 'production',
      allowedOrigins: [origin],
    });
    const response = await server.inject({
      method: 'GET',
      url: '/health/live',
      headers: { origin },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers.vary).toBe('Origin');
  });
});
