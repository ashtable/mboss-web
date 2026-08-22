import { callApi } from '@/lib/api-client';

/**
 * The one-click unsubscribe a mail client fires in
 * the background, from the header the broadcast
 * carries. Nobody sees this response, so it renders
 * nothing and redirects nowhere.
 *
 * The body is ignored on purpose. The signed token
 * is the credential, and refusing because a
 * particular provider formats its form post
 * differently would strand the one request that must
 * never fail.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await context.params;

  const response = await callApi(
    `/v1/waitlist/manage/${encodeURIComponent(token)}/unsubscribe`,
    { method: 'POST' },
  );

  return new Response(null, {
    status: response.ok ? 200 : response.status === 404 ? 404 : 502,
  });
}
