import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

import type { NextAuthConfig } from 'next-auth';

import { addressOf, adminPolicy, canSignIn } from '@/auth/policy';

/**
 * The admin console's only door. Sessions are JWTs,
 * so there is no adapter, no session table and no
 * admin table: membership is the Entra tenant, and
 * the policy reads it off the profile on every
 * sign-in.
 *
 * The provider's credentials arrive under the
 * conventional AUTH_MICROSOFT_ENTRA_ID_* names,
 * which Auth.js picks up itself.
 *
 * The profile mapping is ours rather than the
 * provider's. The stock one reads the `email` claim
 * alone, which a managed account does not send, so
 * sign-in would admit an address the session then did
 * not carry and the console would bounce the admin
 * back to the door. It also drops the provider's
 * Graph photo fetch, which base64-encodes a JPEG into
 * the session cookie on every sign-in.
 */
export const authConfig = {
  providers: [
    MicrosoftEntraID({
      profile: (claims) => ({
        id: claims.sub,
        name: claims.name,
        email: addressOf(claims),
        image: null,
      }),
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    signIn: ({ profile }) => canSignIn(profile, adminPolicy()),
  },
} satisfies NextAuthConfig;
