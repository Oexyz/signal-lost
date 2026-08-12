import { buildServer } from './app.js';
import { parseAllowedOrigins, parsePort } from './config.js';
import { installGracefulShutdown } from './runtime.js';

async function start(): Promise<void> {
  const server = await buildServer({
    allowedOrigins: parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
    logger: true,
  });
  installGracefulShutdown(server);
  await server.listen({
    host: process.env.HOST ?? '127.0.0.1',
    port: parsePort(process.env.PORT),
  });
}

await start();
