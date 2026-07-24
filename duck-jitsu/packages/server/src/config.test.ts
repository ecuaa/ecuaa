import { afterEach, describe, expect, it } from 'vitest';
import { resolveConfig } from './config';

const ORIGINAL = process.env.CORS_ORIGIN;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CORS_ORIGIN;
  else process.env.CORS_ORIGIN = ORIGINAL;
});

describe('resolveConfig corsOrigin', () => {
  it('defaults to * when CORS_ORIGIN is unset', () => {
    delete process.env.CORS_ORIGIN;
    expect(resolveConfig().corsOrigin).toBe('*');
  });

  it('defaults to * when CORS_ORIGIN is set but blank -- this exact bug shipped to prod once', () => {
    process.env.CORS_ORIGIN = '   ';
    expect(resolveConfig().corsOrigin).toBe('*');
  });

  it('uses an explicit non-blank CORS_ORIGIN value', () => {
    process.env.CORS_ORIGIN = 'https://example.com';
    expect(resolveConfig().corsOrigin).toBe('https://example.com');
  });
});
