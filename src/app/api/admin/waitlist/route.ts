import { AdminWaitlistResponseSchema } from '@mboss/zod';

import {
  adminActor,
  allowedQuery,
  badGateway,
  forwardAsAdmin,
  unauthorized,
} from '@/lib/admin-proxy';

const QUERY = ['status', 'q', 'cursor', 'limit'] as const;

export async function GET(request: Request): Promise<Response> {
  const actor = await adminActor();
  if (actor === null) return unauthorized();

  const response = await forwardAsAdmin(
    actor,
    `/v1/admin/waitlist${allowedQuery(request.url, QUERY)}`,
  );
  if (!response.ok) return badGateway();

  return Response.json(
    AdminWaitlistResponseSchema.parse(await response.json()),
  );
}
