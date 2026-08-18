import { serverEnv } from '@/env';

/**
 * Who may sign in to the admin console, as plain
 * functions. Keeping the rule out of the Auth.js
 * config is what lets it be tested directly, without
 * a harness and without a test-only branch in the
 * auth setup.
 */

export type AdminPolicy = {
  tenantId: string;
  allowedDomain: string;
};

/**
 * The tenant is read out of the issuer rather than
 * configured separately. Two variables that must
 * agree are two variables that can disagree, and the
 * one that would silently win is the issuer.
 */
export function tenantFromIssuer(issuer: string): string {
  const segments = new URL(issuer).pathname.split('/').filter(Boolean);
  return segments[0] ?? '';
}

export function adminPolicy(): AdminPolicy {
  const env = serverEnv();
  return {
    tenantId: tenantFromIssuer(env.AUTH_MICROSOFT_ENTRA_ID_ISSUER),
    allowedDomain: env.ADMIN_ALLOWED_DOMAIN,
  };
}

/**
 * The tenant claim is the actual control. Entra does
 * not verify the email claim for arbitrary tenants —
 * whoever runs a free tenant can set a user's mail
 * or UPN to any address they like — so an account
 * from the wrong tenant is refused no matter what it
 * calls itself. The domain check is the second
 * fence, and it anchors on `@` plus the domain at
 * the very end, because `evil-autoretryai.com` and
 * `autoretryai.com.evil.test` both pass a naive
 * substring test.
 */
export function canSignIn(profile: unknown, policy: AdminPolicy): boolean {
  if (typeof profile !== 'object' || profile === null) return false;

  const claims = profile as Record<string, unknown>;
  if (claims.tid !== policy.tenantId) return false;

  // Entra sends `email` by default only for guest
  // accounts; a managed user needs it requested as an
  // optional claim on the app registration. Until it
  // is, `preferred_username` is what arrives.
  const address = claims.email ?? claims.preferred_username;
  if (typeof address !== 'string') return false;

  return address.toLowerCase().endsWith(`@${policy.allowedDomain}`);
}

/**
 * Where a request under /admin should go instead, or
 * null to let it through. Bare /admin is the
 * sign-in page and is matched by the same rule as
 * the console, so it needs its own case — without it
 * the sign-in page redirects to itself forever.
 */
export function adminRedirect(
  pathname: string,
  signedIn: boolean,
): string | null {
  const isSignInPage = pathname === '/admin' || pathname === '/admin/';
  if (signedIn) return isSignInPage ? '/admin/waitlist' : null;
  return isSignInPage ? null : '/admin';
}
