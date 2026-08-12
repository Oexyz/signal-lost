const DEFAULT_PORT = 3_000;

export function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return port;
}

export function parseAllowedOrigins(value: string | undefined): readonly string[] {
  if (value === undefined || value.trim() === '') {
    return [];
  }

  const origins = value.split(',').map((origin) => origin.trim());
  if (origins.some((origin) => origin === '')) {
    throw new Error('ALLOWED_ORIGINS must be a comma-separated list of exact origins');
  }

  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error('ALLOWED_ORIGINS contains an invalid origin');
    }
    if (
      parsed.origin !== origin ||
      (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
    ) {
      throw new Error('ALLOWED_ORIGINS must contain exact HTTP or HTTPS origins');
    }
  }

  return [...new Set(origins)];
}
