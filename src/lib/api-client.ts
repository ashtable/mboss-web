import { serverEnv } from '@/env';

/**
 * The one place the private API's base URL and the
 * service bearer are attached. Every route handler
 * goes through it, so no handler can forget the
 * token and none can accidentally hand it to the
 * browser.
 */
export async function callApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const env = serverEnv();
  return call(path, init, env.WEB_SERVICE_TOKEN);
}

/**
 * The API's internal surface, which takes the other
 * token. Only the SendGrid webhook forwards there,
 * and the two tokens are one typo apart, so the
 * difference is a named function rather than an
 * argument someone could pass the wrong value to.
 */
export async function callInternalApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const env = serverEnv();
  return call(path, init, env.INTERNAL_API_TOKEN);
}

async function call(
  path: string,
  init: RequestInit | undefined,
  token: string,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set('authorization', `Bearer ${token}`);

  return fetch(`${serverEnv().API_BASE_URL}${path}`, {
    ...init,
    headers,
    // The API is a sibling container on a private
    // network. If it stops answering, the page
    // should say so rather than hold the request
    // open until the platform kills it.
    signal: AbortSignal.timeout(10_000),
  });
}
