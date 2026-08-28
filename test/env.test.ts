import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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

function readExample(): string {
  return readFileSync(
    fileURLToPath(new URL('../.env.example', import.meta.url)),
    'utf8',
  );
}

/**
 * Enough of the dotenv format for a file we write
 * ourselves: `KEY=value` lines, comments, blanks. No
 * quoting or interpolation, because this file uses
 * neither and a parser that guessed at them could
 * disagree with the one that actually loads it.
 */
function parseDotenv(text: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    values[trimmed.slice(0, separator)] = trimmed.slice(separator + 1);
  }
  return values;
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
    expect(message).toContain('AUTH_URL');
    expect(message).toContain('WEB_SERVICE_TOKEN');
    expect(message).toContain('AUTH_SECRET');
    expect(message).toContain('AUTH_MICROSOFT_ENTRA_ID_ID');
    expect(message).toContain('AUTH_MICROSOFT_ENTRA_ID_SECRET');
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

  it('requires AUTH_URL, which is what makes the host trusted', () => {
    // Auth.js decides `trustHost` for itself, and in
    // production it is false unless AUTH_URL,
    // AUTH_TRUST_HOST, VERCEL or CF_PAGES is set —
    // whereupon every /api/auth request answers
    // UntrustedHost and nobody can sign in. AUTH_URL
    // also pins the callback origin behind a
    // platform proxy instead of trusting the Host
    // header.
    const message = messageFor({ ...COMPLETE_ENV, AUTH_URL: undefined });
    expect(message).toContain('AUTH_URL');
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

describe('AUTH_SECRET in production', () => {
  const production = { ...COMPLETE_ENV, NODE_ENV: 'production' };

  it('refuses the published development default', () => {
    // The default is committed in .env.example, so a
    // deploy that inherits it hands the console to
    // anyone who has read the repository. It works
    // silently, which is why it has to fail at boot.
    // Note it is long enough to clear the length
    // floor: only the equality check catches it.
    expect(messageFor(production)).toContain('AUTH_SECRET');
  });

  it('refuses a secret too short to be worth guessing at', () => {
    expect(messageFor({ ...production, AUTH_SECRET: 'hunter2' })).toContain(
      'AUTH_SECRET',
    );
  });

  it('accepts a generated secret', () => {
    expect(
      readEnv({ ...production, AUTH_SECRET: 'a'.repeat(44) }).AUTH_SECRET,
    ).toBe('a'.repeat(44));
  });

  it('leaves development with its readable default', () => {
    // The readable default is what the whole local
    // stack shares — .env.example and a developer's
    // .env.local, which compose reads. Production
    // refuses it; development must not.
    expect(readEnv(COMPLETE_ENV).AUTH_SECRET).toBe(
      'dev-auth-secret-not-for-production-use',
    );
  });
});

describe('.env.example', () => {
  it('boots the app on its own', () => {
    // The file's whole purpose is `cp .env.example
    // .env.local && npm run dev`, and the only thing
    // that can prove it still works is the same
    // parser the app boots with. A variable added to
    // the schema and forgotten here turns a clean
    // checkout into a crash on first run.
    expect(() => readEnv(parseDotenv(readExample()))).not.toThrow();
  });

  it('ships an AUTH_SECRET production refuses', () => {
    // The two rules above pull in opposite
    // directions: the file must boot the app as
    // copied, which under a production build means
    // clearing the 32-character floor — and clearing
    // that floor is exactly what would let a
    // published secret through. Only the equality
    // check against DEV_AUTH_SECRET separates them,
    // so this asserts the file and that constant
    // still name the same string. Editing one alone
    // would quietly publish a working production
    // secret.
    const example = parseDotenv(readExample());
    const message = messageFor({
      ...example,
      NODE_ENV: 'production',
    });
    expect(message).toContain('AUTH_SECRET');
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
