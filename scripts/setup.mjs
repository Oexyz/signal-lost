import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const examplePath = fileURLToPath(new URL('../.env.example', import.meta.url));
const localPath = fileURLToPath(new URL('../.env.local', import.meta.url));

if (!existsSync(examplePath)) {
  throw new Error('.env.example is missing. Refusing to create local configuration.');
}

if (existsSync(localPath)) {
  console.log('Local configuration already exists; no values were changed.');
} else {
  const example = readFileSync(examplePath, 'utf8');
  const secret = randomBytes(48).toString('base64url');
  const local = example.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET=${secret}`);

  if (local === example) {
    throw new Error('SESSION_SECRET is not declared in .env.example.');
  }

  writeFileSync(localPath, local, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  console.log('Created .env.local with a new local-only session secret.');
}

const docker = spawnSync('docker', ['compose', 'version'], {
  cwd: root,
  encoding: 'utf8',
  shell: process.platform === 'win32',
  stdio: 'ignore',
});

if (docker.status !== 0) {
  console.log('Docker Compose is unavailable; database services were not started.');
  console.log('The Phase 0 application can run without PostgreSQL.');
  process.exit(0);
}

if (!existsSync(fileURLToPath(new URL('../docker-compose.yml', import.meta.url)))) {
  console.log('Docker Compose is available; no compose definition exists yet.');
  process.exit(0);
}

const started = spawnSync('docker', ['compose', 'up', '-d', 'postgres'], {
  cwd: root,
  encoding: 'utf8',
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

if (started.status !== 0) {
  throw new Error('Docker Compose could not start the local PostgreSQL service.');
}

console.log('Local PostgreSQL service is running.');
