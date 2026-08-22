import { EmailEventsRequestSchema, EmailEventTypeSchema } from '@mboss/zod';

import { serverEnv } from '@/env';
import { callInternalApi } from '@/lib/api-client';
import { verifySendGridSignature } from '@/lib/sendgrid-signature';

/**
 * Where SendGrid tells us a message could not be
 * delivered. Order matters: read the raw body, check
 * the signature over exactly those bytes, and only
 * then parse. Parsing first would mean verifying a
 * re-serialised body, whose key order and whitespace
 * are not what was signed.
 *
 * Of everything the provider reports, only a bounce
 * and a spam complaint change anything here, so
 * those are the only two forwarded — and a delivery
 * carrying none of them is answered 200 without a
 * call, because the internal route takes a non-empty
 * array and an empty forward would fail the most
 * ordinary batch there is.
 */

const SIGNATURE_HEADER = 'x-twilio-email-event-webhook-signature';
const TIMESTAMP_HEADER = 'x-twilio-email-event-webhook-timestamp';

export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get(SIGNATURE_HEADER);
  const timestamp = request.headers.get(TIMESTAMP_HEADER);
  const rawBody = await request.text();

  if (
    signature === null ||
    timestamp === null ||
    !verifySendGridSignature({
      publicKeyDer: serverEnv().SENDGRID_WEBHOOK_PUBLIC_KEY,
      rawBody,
      signature,
      timestamp,
    })
  ) {
    return new Response(null, { status: 401 });
  }

  let delivered: unknown;
  try {
    delivered = JSON.parse(rawBody);
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!Array.isArray(delivered)) {
    return new Response(null, { status: 400 });
  }

  const interesting = delivered.filter(
    (event: unknown) =>
      typeof event === 'object' &&
      event !== null &&
      EmailEventTypeSchema.safeParse((event as { event?: unknown }).event)
        .success,
  );
  if (interesting.length === 0) {
    return Response.json({ processed: 0, bounced: 0 });
  }

  const parsed = EmailEventsRequestSchema.safeParse(interesting);
  if (!parsed.success) {
    return new Response(null, { status: 400 });
  }

  const response = await callInternalApi('/internal/v1/email-events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });

  // The provider retries a non-2xx, which is what
  // should happen when the API is briefly down.
  return new Response(null, { status: response.ok ? 200 : 502 });
}
