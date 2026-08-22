import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { adminRedirect, sessionAddress } from '@/auth/policy';

/**
 * Next 16 calls this file `proxy.ts`; the old
 * `middleware.ts` name survives only as the escape
 * hatch for the Edge runtime, which this gate has no
 * use for.
 *
 * This is a redirect for people, not the
 * authorization boundary. Auth.js says as much, and
 * the console layout and every /api/admin route
 * check the session again server-side — a proxy can
 * be bypassed by anything that reaches a handler
 * directly.
 */
export const proxy = auth((request) => {
  const signedIn = sessionAddress(request.auth) !== null;
  const target = adminRedirect(request.nextUrl.pathname, signedIn);
  if (target === null) return;
  return NextResponse.redirect(new URL(target, request.nextUrl));
});

export const config = { matcher: ['/admin/:path*'] };
