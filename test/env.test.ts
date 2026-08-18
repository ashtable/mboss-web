import { describe, expect, it } from 'vitest';

import { readEnv } from '@/env';
import { COMPLETE_ENV, TENANT_ID } from './helpers/env.js';

function messageFor(source: Record<string, string | undefined>): string {
  try {
    readEnv(source);
  } catch (error) {
    return (error as Error).message;
  }
  return '';
}

describe('readEnv', () => {
  it('parses a complete environment', () => {
    expect(readEnv(COMPLETE_ENV)).toMatchObject({
      API_BASE_URL: 'http://api:3001',
      WEB_SERVICE_TOKEN: 'dev-web-service-token',
    });
  });

  it('names every missing variable in one error', () => {
    // A partial error costs two more restarts to
    // learn the rest.
    const message = messageFor({});
    expect(message).toContain('API_BASE_URL');
    expect(message).toContain('WEB_SERVICE_TOKEN');
    expect(message).toContain('AUTH_SECRET');
    expect(message).toContain('AUTH_MICROSOFT_ENTRA_ID_ID');
    expect(message).toContain('AUTH_MICROSOFT_ENTRA_ID_SECRET');
    expect(message).toContain('SENDGRID_WEBHOOK_PUBLIC_KEY');
    expect(message).toContain('INTERNAL_API_TOKEN');
  });

  it('strips a trailing slash from API_BASE_URL', () => {
    // Otherwise `${API_BASE_URL}/v1/...` doubles the
    // slash, which looks right in the source and is
    // wrong on the wire.
    expect(
      readEnv({ ...COMPLETE_ENV, API_BASE_URL: 'http://api:3001/' })
        .API_BASE_URL,
    ).toBe('http://api:3001');
  });

  it('defaults NEXT_PUBLIC_SITE_URL to the production origin', () => {
    expect(readEnv(COMPLETE_ENV).NEXT_PUBLIC_SITE_URL).toBe(
      'https://mboss.dev',
    );
  });

  it('defaults ADMIN_ALLOWED_DOMAIN', () => {
    expect(readEnv(COMPLETE_ENV).ADMIN_ALLOWED_DOMAIN).toBe('autoretryai.com');
  });

  it.each(['common', 'organizations', 'consumers'])(
    'rejects a %s issuer',
    (tenant) => {
      // A multi-tenant issuer plus a domain check
      // admits accounts an attacker controls, because
      // Entra does not verify the email claim across
      // tenants. Failing at boot is the only place to
      // catch that before the deploy is live.
      const message = messageFor({
        ...COMPLETE_ENV,
        AUTH_MICROSOFT_ENTRA_ID_ISSUER: `https://login.microsoftonline.com/${tenant}/v2.0`,
      });
      expect(message).toContain('AUTH_MICROSOFT_ENTRA_ID_ISSUER');
    },
  );

  it('accepts a tenant-pinned issuer', () => {
    expect(readEnv(COMPLETE_ENV).AUTH_MICROSOFT_ENTRA_ID_ISSUER).toContain(
      TENANT_ID,
    );
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
