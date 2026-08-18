import { describe, expect, it } from 'vitest';

import { readEnv } from '@/env';

const complete = {
  API_BASE_URL: 'http://api:3001',
  WEB_SERVICE_TOKEN: 'dev-web-service-token',
};

describe('readEnv', () => {
  it('parses a complete environment', () => {
    expect(readEnv(complete)).toMatchObject({
      API_BASE_URL: 'http://api:3001',
      WEB_SERVICE_TOKEN: 'dev-web-service-token',
    });
  });

  it('names every missing variable in one error', () => {
    // A partial error costs two more restarts to
    // learn the rest.
    let message = '';
    try {
      readEnv({});
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('API_BASE_URL');
    expect(message).toContain('WEB_SERVICE_TOKEN');
  });

  it('strips a trailing slash from API_BASE_URL', () => {
    // Otherwise `${API_BASE_URL}/v1/...` doubles the
    // slash, which looks right in the source and is
    // wrong on the wire.
    expect(
      readEnv({ ...complete, API_BASE_URL: 'http://api:3001/' }).API_BASE_URL,
    ).toBe('http://api:3001');
  });

  it('defaults NEXT_PUBLIC_SITE_URL to the production origin', () => {
    expect(readEnv(complete).NEXT_PUBLIC_SITE_URL).toBe('https://mboss.dev');
  });
});

describe('module scope', () => {
  it('reads nothing at import time', async () => {
    // `next build` runs with none of these set. An
    // env read at module scope would fail the build
    // rather than the request.
    const original = process.env;
    process.env = {} as typeof process.env;
    try {
      await expect(import('@/env')).resolves.toBeTruthy();
    } finally {
      process.env = original;
    }
  });
});
