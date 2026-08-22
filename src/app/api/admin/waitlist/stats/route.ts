import { WaitlistStatsResponseSchema } from '@mboss/zod';

import {
  adminActor,
  badGateway,
  forwardAsAdmin,
  unauthorized,
} from '@/lib/admin-proxy';

export async function GET(): Promise<Response> {
  const actor = await adminActor();
  if (actor === null) return unauthorized();

  const response = await forwardAsAdmin(actor, '/v1/admin/waitlist/stats');
  if (!response.ok) return badGateway();

  return Response.json(
    WaitlistStatsResponseSchema.parse(await response.json()),
  );
}
