import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

import { adminPolicy, canSignIn } from '@/auth/policy';

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
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [MicrosoftEntraID({})],
  session: { strategy: 'jwt' },
  callbacks: {
    signIn: ({ profile }) => canSignIn(profile, adminPolicy()),
  },
});
