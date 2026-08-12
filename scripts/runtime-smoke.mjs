import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const serverEntry = fileURLToPath(new URL('../apps/server/dist/main.js', import.meta.url));
const allowedOrigin = 'https://signal-lost.example';

function reserveLoopbackPort() {
  return new Promise((resolve, reject) => {
    const reservation = createServer();
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', () => {
      const address = reservation.address();
      if (address === null || typeof address === 'string') {
        reservation.close();
        reject(new Error('Could not reserve a loopback port.'));
        return;
      }
      reservation.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForHealth(url, processExited) {
  const deadline = Date.now() + 20_000;
  let lastError;
  while (Date.now() < deadline) {
    const race = await Promise.race([
      fetch(url)
        .then((response) => ({ response }))
        .catch((error) => ({ error })),
      processExited.then((exit) => ({ exit })),
    ]);
    if ('exit' in race) {
      throw new Error(`Server exited before it became healthy (code ${String(race.exit.code)}, signal ${String(race.exit.signal)}).`);
    }
    if (race.response?.ok) return race.response;
    lastError = race.error ?? new Error(`Health endpoint returned ${String(race.response?.status)}.`);
    await delay(150);
  }
  throw new Error(`Server did not become healthy within 20 seconds: ${String(lastError)}`);
}

function assertHealthResponse(response, body, route) {
  if (response.status !== 200 || body.status !== 'ok') {
    throw new Error(`${route} returned an unexpected response.`);
  }
  if (response.headers.get('cache-control') !== 'no-store') {
    throw new Error(`${route} is missing Cache-Control: no-store.`);
  }
  if (response.headers.get('x-content-type-options') !== 'nosniff') {
    throw new Error(`${route} is missing X-Content-Type-Options: nosniff.`);
  }
  if (!response.headers.get('content-type')?.startsWith('application/json')) {
    throw new Error(`${route} did not return JSON.`);
  }
}

async function stopChild(child, processExited) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  const stopped = await Promise.race([
    processExited.then(() => true),
    delay(5_000).then(() => false),
  ]);
  if (!stopped) child.kill('SIGKILL');
  if (!stopped) {
    await processExited;
    throw new Error('Server required SIGKILL after missing its shutdown deadline.');
  }
}

const port = await reserveLoopbackPort();
const child = spawn(process.execPath, [serverEntry], {
  cwd: root,
  env: {
    ...process.env,
    ALLOWED_ORIGINS: allowedOrigin,
    HOST: '127.0.0.1',
    NODE_ENV: 'production',
    PORT: String(port),
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});
let stderr = '';
child.stderr.setEncoding('utf8');
child.stderr.on('data', (chunk) => {
  stderr = `${stderr}${chunk}`.slice(-16_384);
});
const processExited = new Promise((resolve) => {
  child.once('exit', (code, signal) => resolve({ code, signal }));
});

try {
  const liveResponse = await waitForHealth(`http://127.0.0.1:${port}/health/live`, processExited);
  const liveBody = await liveResponse.json();
  assertHealthResponse(liveResponse, liveBody, '/health/live');

  const readyResponse = await fetch(`http://127.0.0.1:${port}/health/ready`);
  const readyBody = await readyResponse.json();
  assertHealthResponse(readyResponse, readyBody, '/health/ready');

  const allowedResponse = await fetch(`http://127.0.0.1:${port}/health/live`, {
    headers: { origin: allowedOrigin },
  });
  if (
    allowedResponse.status !== 200 ||
    allowedResponse.headers.get('access-control-allow-origin') !== allowedOrigin
  ) {
    throw new Error('Configured production origin was not allowed.');
  }

  const deniedResponse = await fetch(`http://127.0.0.1:${port}/health/live`, {
    headers: { origin: 'https://untrusted.example' },
  });
  if (
    deniedResponse.status !== 403 ||
    JSON.stringify(await deniedResponse.json()) !==
      JSON.stringify({ error: 'origin_not_allowed' })
  ) {
    throw new Error('Untrusted production origin was not rejected.');
  }

  console.log(
    `runtime smoke passed on 127.0.0.1:${String(port)}; live=200, ready=200, origin=200/403`,
  );
} catch (error) {
  if (stderr.trim()) console.error(stderr.trim());
  throw error;
} finally {
  await stopChild(child, processExited);
}
