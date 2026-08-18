import { describe, expect, it } from 'vitest';

import type { MicrosoftEntraIDProfile } from 'next-auth/providers/microsoft-entra-id';
import type { OIDCConfig } from 'next-auth/providers';

import { authConfig } from '@/auth/config';
import { TENANT_ID } from '../helpers/env.js';

/**
 * Entra's own profile type declares every claim as
 * present. A managed account's id_token carries these
 * four and no `email` at all, which is the case this
 * mapping exists for.
 */
const MANAGED = {
  sub: '00000000-0000-4000-8000-00000000abcd',
  name: 'Ash Srinivas',
  tid: TENANT_ID,
  preferred_username: 'ash@autoretryai.com',
} as unknown as MicrosoftEntraIDProfile;

/**
 * Auth.js merges the options a provider was called
 * with over that provider's own defaults on every
 * request, so the mapping that actually runs is the
 * one in `options` whenever there is one.
 */
type ProfileMapping = NonNullable<
  OIDCConfig<MicrosoftEntraIDProfile>['profile']
>;

function profileMapping(): ProfileMapping {
  const [provider] = authConfig.providers;
  if (provider === undefined) throw new Error('no provider is configured');

  const mapping = provider.options?.profile ?? provider.profile;
  if (mapping === undefined) throw new Error('the provider maps no profile');
  return mapping;
}

/** The mapping reads claims and nothing else. */
const NO_TOKENS = {} as Parameters<ProfileMapping>[1];

describe('the Entra provider as configured', () => {
  it('gives the session the address the policy admitted', async () => {
    // canSignIn falls back to preferred_username,
    // so a session built from `email` alone is
    // empty for exactly the accounts sign-in just
    // let through — and the console sends an
    // addressless session back to the sign-in page.
    const user = await profileMapping()(MANAGED, NO_TOKENS);

    expect(user.email).toBe('ash@autoretryai.com');
  });

  it('reaches nothing over the network to build a session', async () => {
    // The stock mapping fetches a Graph profile photo
    // and base64-encodes the JPEG into the session
    // cookie. Sign-in should not depend on a second
    // Microsoft service being up.
    const calls: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (input: RequestInfo | URL) => {
      calls.push(String(input));
      return Promise.reject(new Error('no network in this test'));
    };
    try {
      await profileMapping()(MANAGED, NO_TOKENS);
    } finally {
      globalThis.fetch = original;
    }

    expect(calls).toEqual([]);
  });
});
