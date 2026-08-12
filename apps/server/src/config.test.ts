import { describe, expect, it } from 'vitest';

import { parseAllowedOrigins, parsePort } from './config.js';

describe('server environment parsing', () => {
  it('parses exact unique browser origins', () => {
    expect(
      parseAllowedOrigins('https://signal-lost.example,http://127.0.0.1:5173,https://signal-lost.example'),
    ).toEqual(['https://signal-lost.example', 'http://127.0.0.1:5173']);
  });

  it.each([
    'https://signal-lost.example/',
    'https://user@signal-lost.example',
    'wss://signal-lost.example',
    'https://signal-lost.example/path',
    'https://signal-lost.example,',
    'not-an-origin',
  ])('rejects an invalid allowed-origin value: %s', (value) => {
    expect(() => parseAllowedOrigins(value)).toThrow(/ALLOWED_ORIGINS/u);
  });

  it('parses a valid port and rejects unsafe values', () => {
    expect(parsePort(undefined)).toBe(3_000);
    expect(parsePort('8787')).toBe(8_787);
    expect(() => parsePort('0')).toThrow(/PORT/u);
    expect(() => parsePort('12.5')).toThrow(/PORT/u);
  });
});
