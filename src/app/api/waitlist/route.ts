import {
  WaitlistSignupRequestSchema,
  WaitlistSignupResponseSchema,
} from '@mboss/zod';

import { callApi } from '@/lib/api-client';

/**
 * The join box's only call. Signing up is
 * idempotent on the API side and re-subscribes an
 * address that had unsubscribed or bounced, so
 * there is deliberately no status-specific branch
 * here: whatever row comes back is the row the
 * success card shows.
 */
export async function POST(request: Request): Promise<Response> {
  const parsed = WaitlistSignupRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: 'Enter a valid email address.' },
      { status: 400 },
    );
  }

  const response = await callApi('/v1/waitlist/signups', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });

  if (!response.ok) {
    // The API's own body can name hosts and
    // internal state, none of which belongs in a
    // browser.
    return Response.json(
      { error: 'Could not reach the waitlist. Try again in a moment.' },
      { status: 502 },
    );
  }

  return Response.json(
    WaitlistSignupResponseSchema.parse(await response.json()),
  );
}
