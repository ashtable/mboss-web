import {
  ManageStateResponseSchema,
  type ManageStateResponse,
} from '@mboss/zod';

import { callApi } from '@/lib/api-client';

/**
 * The manage page's one read. A 404 means the link
 * is not usable and says nothing about why — forged,
 * revoked, expired, never issued all answer the
 * same, so there is one error state rather than
 * four, and a stranger with a guessed token learns
 * nothing.
 *
 * Anything else is an outage and throws, because
 * telling someone their link is bad when the API is
 * down sends them hunting for an email that was
 * fine.
 */
export async function fetchManageState(
  token: string,
): Promise<ManageStateResponse | null> {
  const response = await callApi(
    `/v1/waitlist/manage/${encodeURIComponent(token)}`,
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`manage state request failed: ${response.status}`);
  }
  return ManageStateResponseSchema.parse(await response.json());
}
