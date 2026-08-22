import { describe, expect, it } from 'vitest';

import {
  adminRedirect,
  canSignIn,
  sessionAddress,
  tenantFromIssuer,
} from '@/auth/policy';
import { TENANT_ID } from '../helpers/env.js';

const policy = { tenantId: TENANT_ID, allowedDomain: 'autoretryai.com' };

describe('tenantFromIssuer', () => {
  it('extracts the tenant from a v2 issuer', () => {
    expect(
      tenantFromIssuer(`https://login.microsoftonline.com/${TENANT_ID}/v2.0`),
    ).toBe(TENANT_ID);
  });

  it('extracts it with a trailing slash too', () => {
    expect(
      tenantFromIssuer(`https://login.microsoftonline.com/${TENANT_ID}/v2.0/`),
    ).toBe(TENANT_ID);
  });
});

describe('canSignIn', () => {
  it('admits the right tenant and an allowed domain', () => {
    expect(
      canSignIn({ tid: TENANT_ID, email: 'ash@autoretryai.com' }, policy),
    ).toBe(true);
  });

  it('rejects a foreign tenant even with an allowed-looking address', () => {
    // Entra does not verify the email claim for
    // arbitrary tenants: the admin of any free tenant
    // can set a user's mail or UPN to
    // anything@autoretryai.com. The tenant is the
    // control; the domain check is a second fence.
    expect(
      canSignIn(
        {
          tid: '99999999-9999-4999-8999-999999999999',
          email: 'ash@autoretryai.com',
        },
        policy,
      ),
    ).toBe(false);
  });

  it('rejects the right tenant with the wrong domain', () => {
    expect(
      canSignIn({ tid: TENANT_ID, email: 'ash@example.test' }, policy),
    ).toBe(false);
  });

  it.each([
    'ash@evil-autoretryai.com',
    'ash@autoretryai.com.evil.test',
    'autoretryai.com@evil.test',
  ])('rejects %s, which only looks like the domain', (email) => {
    // The check is on `@` plus the domain at the very
    // end. Every one of these passes a naive
    // substring test.
    expect(canSignIn({ tid: TENANT_ID, email }, policy)).toBe(false);
  });

  it('is case-insensitive about the tenant and the domain', () => {
    // The portal hands the GUID out in mixed case,
    // the domain is typed by hand, and Entra sends
    // `tid` lowercase. Comparing case-sensitively
    // turns an ordinary paste into AccessDenied for
    // every account in the tenant, with nothing
    // anywhere naming the cause.
    expect(
      canSignIn(
        { tid: TENANT_ID.toUpperCase(), email: 'ash@autoretryai.com' },
        {
          tenantId: TENANT_ID.toUpperCase(),
          allowedDomain: 'AutoRetryAI.com',
        },
      ),
    ).toBe(true);
  });

  it('rejects a profile with no tenant claim', () => {
    expect(canSignIn({ email: 'ash@autoretryai.com' }, policy)).toBe(false);
  });

  it('rejects a profile with no address at all', () => {
    expect(canSignIn({ tid: TENANT_ID }, policy)).toBe(false);
  });

  it('falls back to preferred_username when email is absent', () => {
    // Entra sends `email` by default only for guests;
    // a managed user needs it configured as an
    // optional claim. Until it is, this fallback is
    // the only thing that works.
    expect(
      canSignIn(
        { tid: TENANT_ID, preferred_username: 'ash@autoretryai.com' },
        policy,
      ),
    ).toBe(true);
  });

  it('rejects anything that is not a profile object', () => {
    expect(canSignIn(null, policy)).toBe(false);
    expect(canSignIn('ash@autoretryai.com', policy)).toBe(false);
  });
});

describe('sessionAddress', () => {
  it('reads the address off a session', () => {
    expect(
      sessionAddress({
        user: { email: 'ash@autoretryai.com' },
        expires: '2026-09-17T00:00:00.000Z',
      }),
    ).toBe('ash@autoretryai.com');
  });

  it.each([
    ['no session', null],
    ['a session with no user', { expires: '2026-09-17T00:00:00.000Z' }],
    [
      'a session whose user has no address',
      { user: {}, expires: '2026-09-17T00:00:00.000Z' },
    ],
  ])('answers null for %s', (_name, session) => {
    // Every gate under /admin has to give the same
    // answer here. The sign-in page treating a
    // session as signed in while the console treats
    // the same session as signed out is a redirect
    // loop, not a stricter check.
    expect(sessionAddress(session)).toBeNull();
  });
});

describe('adminRedirect', () => {
  it('sends a signed-out visitor from the console to the sign-in page', () => {
    expect(adminRedirect('/admin/waitlist', false)).toBe('/admin');
  });

  it('leaves a signed-out visitor on the sign-in page', () => {
    // The matcher covers bare /admin as well, so
    // without this case the sign-in page redirects to
    // itself forever.
    expect(adminRedirect('/admin', false)).toBeNull();
  });

  it('sends a signed-in admin from the sign-in page to the console', () => {
    expect(adminRedirect('/admin', true)).toBe('/admin/waitlist');
  });

  it('leaves a signed-in admin in the console', () => {
    expect(adminRedirect('/admin/waitlist', true)).toBeNull();
  });
});
