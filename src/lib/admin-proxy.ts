import { auth } from '@/auth';
import { sessionAddress } from '@/auth/policy';
import { callApi } from '@/lib/api-client';

/**
 * The shape every /api/admin route is built from.
 *
 * The proxy in src/proxy.ts redirects people; it is
 * not the authorization boundary, and a request that
 * reaches one of these handlers directly has never
 * passed it. So each handler checks the session
 * again here, and `adminActor` returning null rather
 * than throwing makes the compiler insist on it:
 * `forwardAsAdmin` takes a plain string, so the null
 * has to be dealt with before anything can be
 * forwarded.
 */

/** The signed-in admin's address, or null. */
export async function adminActor(): Promise<string | null> {
  return sessionAddress(await auth());
}

export function unauthorized(): Response {
  return Response.json({ error: 'Not signed in' }, { status: 401 });
}

/**
 * Forwards to the private API carrying the service
 * bearer and, as `x-admin-actor`, the address of the
 * admin who asked. The API authenticates on the
 * bearer alone and treats the header as audit data,
 * so a bug that dropped the bearer while keeping the
 * header would fail closed at the API rather than
 * open. The header goes on every admin forward, not
 * only the routes that record it — one rule is
 * easier to hold than a list of exceptions.
 */
export async function forwardAsAdmin(
  actor: string,
  apiPath: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set('x-admin-actor', actor);
  return callApi(apiPath, { ...init, headers });
}

/**
 * Rebuilds a query string from the parameters the
 * API actually accepts. Anything else the client
 * appended is dropped here rather than handed
 * downstream to be interpreted.
 */
export function allowedQuery(url: string, allowed: readonly string[]): string {
  const source = new URL(url).searchParams;
  const kept = new URLSearchParams();
  for (const name of allowed) {
    const value = source.get(name);
    if (value !== null) kept.set(name, value);
  }
  const query = kept.toString();
  return query === '' ? '' : `?${query}`;
}

/**
 * The API's body is for operators, not browsers: it
 * can name hosts and internal state. Every failure
 * becomes one fixed message.
 */
export function badGateway(): Response {
  return Response.json(
    { error: 'The waitlist service did not answer.' },
    { status: 502 },
  );
}
