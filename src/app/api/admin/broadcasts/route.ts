import {
  BroadcastListResponseSchema,
  BroadcastResponseSchema,
  CreateBroadcastRequestSchema,
} from '@mboss/zod';

import {
  adminActor,
  badGateway,
  forwardAsAdmin,
  unauthorized,
} from '@/lib/admin-proxy';

export async function GET(): Promise<Response> {
  const actor = await adminActor();
  if (actor === null) return unauthorized();

  const response = await forwardAsAdmin(actor, '/v1/admin/broadcasts');
  if (!response.ok) return badGateway();

  return Response.json(
    BroadcastListResponseSchema.parse(await response.json()),
  );
}

export async function POST(request: Request): Promise<Response> {
  const actor = await adminActor();
  if (actor === null) return unauthorized();

  const parsed = CreateBroadcastRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: 'A broadcast needs a subject, a body and an audience.' },
      { status: 400 },
    );
  }

  const response = await forwardAsAdmin(actor, '/v1/admin/broadcasts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });
  if (!response.ok) return badGateway();

  return Response.json(BroadcastResponseSchema.parse(await response.json()));
}
