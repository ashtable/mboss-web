import type { Session } from 'next-auth';

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
  const claims = claimsOf(profile);
  if (claims === null) return false;

  // Both sides are folded here rather than where the
  // policy is built, so no caller can hand this
  // function a policy that is right except for its
  // casing. Entra sends `tid` lowercase, while the
  // portal hands the GUID out in mixed case and the
  // domain is typed by hand — and a case-sensitive
  // comparison fails closed, which looks exactly
  // like a rejected account rather than a typo.
  const { tid } = claims;
  if (typeof tid !== 'string') return false;
  if (tid.toLowerCase() !== policy.tenantId.toLowerCase()) return false;

  const address = addressOf(profile);
  if (address === null) return false;

  const domain = policy.allowedDomain.toLowerCase();
  return address.toLowerCase().endsWith(`@${domain}`);
}

/**
 * The address to treat as this account's own, or
 * null.
 *
 * Entra sends `email` by default only for guest
 * accounts; a managed user needs it requested as an
 * optional claim on the app registration, and until
 * it is, `preferred_username` is what arrives. Both
 * the sign-in check and the session are built from
 * this one rule, so the address that was admitted is
 * always the address that is carried.
 */
export function addressOf(profile: unknown): string | null {
  const claims = claimsOf(profile);
  if (claims === null) return null;

  const address = claims.email ?? claims.preferred_username;
  return typeof address === 'string' ? address : null;
}

function claimsOf(profile: unknown): Record<string, unknown> | null {
  if (typeof profile !== 'object' || profile === null) return null;
  return profile as Record<string, unknown>;
}

/**
 * The address a session belongs to, or null when it
 * has none.
 *
 * Every gate under /admin asks this one question —
 * the sign-in page to decide whether to step aside,
 * the console and the admin proxies to decide whether
 * to let a request past. Two gates that answered it
 * differently would bounce a visitor between them
 * until the browser gave up.
 */
export function sessionAddress(session: Session | null): string | null {
  return session?.user?.email ?? null;
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
