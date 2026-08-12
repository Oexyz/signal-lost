import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));

await rm(new URL('dist/', import.meta.url), { force: true, recursive: true });

await build({
  absWorkingDir: packageRoot,
  bundle: true,
  chunkNames: 'chunks/[name]-[hash]',
  entryPoints: ['src/index.ts', 'src/main.ts'],
  external: ['@fastify/websocket', 'fastify'],
  format: 'esm',
  logLevel: 'info',
  outdir: 'dist',
  platform: 'node',
  splitting: true,
  target: 'node24',
});
