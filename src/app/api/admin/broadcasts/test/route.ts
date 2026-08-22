import { TestSendRequestSchema, TestSendResponseSchema } from '@mboss/zod';

import {
  adminActor,
  badGateway,
  forwardAsAdmin,
  unauthorized,
} from '@/lib/admin-proxy';

/**
 * "Send test to me" means me. The recipient comes
 * from the session, never from the body — taking it
 * from the request would let the console be pointed
 * at any address at all.
 */
export async function POST(request: Request): Promise<Response> {
  const actor = await adminActor();
  if (actor === null) return unauthorized();

  const parsed = TestSendRequestSchema.safeParse({
    ...(await request.json().catch(() => ({}))),
    to: actor,
  });
  if (!parsed.success) {
    return Response.json(
      { error: 'A test send needs a subject and a body.' },
      { status: 400 },
    );
  }

  const response = await forwardAsAdmin(actor, '/v1/admin/broadcasts/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });
  if (!response.ok) return badGateway();

  return Response.json(TestSendResponseSchema.parse(await response.json()));
}
