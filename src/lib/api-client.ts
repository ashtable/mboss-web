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
  const headers = new Headers(init?.headers);
  headers.set('authorization', `Bearer ${env.WEB_SERVICE_TOKEN}`);

  return fetch(`${env.API_BASE_URL}${path}`, {
    ...init,
    headers,
    // The API is a sibling container on a private
    // network. If it stops answering, the page
    // should say so rather than hold the request
    // open until the platform kills it.
    signal: AbortSignal.timeout(10_000),
  });
}
