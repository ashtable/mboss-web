import { ManageActionResponseSchema } from '@mboss/zod';

import { callApi } from '@/lib/api-client';

/**
 * The three things a subscriber can do with their
 * own link. The action is checked against this list
 * before it is put in a URL — a path segment taken
 * straight from the request and interpolated into
 * one is how a proxy becomes a way to reach the
 * routes it was never meant to.
 *
 * The token itself is passed through untouched. This
 * app holds no key ring and never decodes one; the
 * API verifies it and answers 404 if it cannot.
 */
const ACTIONS = ['pause', 'resume', 'unsubscribe'];

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string; action: string }> },
): Promise<Response> {
  const { token, action } = await context.params;
  if (!ACTIONS.includes(action)) {
    return new Response(null, { status: 404 });
  }

  const response = await callApi(
    `/v1/waitlist/manage/${encodeURIComponent(token)}/${action}`,
    { method: 'POST' },
  );
  if (!response.ok) {
    return new Response(null, { status: response.status === 404 ? 404 : 502 });
  }

  return Response.json(ManageActionResponseSchema.parse(await response.json()));
}
