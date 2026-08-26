import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  AdminWaitlistResponseSchema,
  SubscriberStatusSchema,
  WaitlistStatsResponseSchema,
  type WaitlistStatsResponse,
} from '@mboss/zod';

import { adminActor, forwardAsAdmin } from '@/lib/admin-proxy';

import { StatusChips } from './status-chips';
import { WaitlistTable } from './waitlist-table';

/**
 * Who is on the list. The filter and the search live
 * in the URL rather than in component state, so the
 * page is a plain server render of whatever the query
 * string asks for and a link or a reload lands on the
 * same view.
 */
export const dynamic = 'force-dynamic';

const FOOTER =
  'the list is an audience, not a queue — Compose update sends a ' +
  'Twilio Email broadcast. No invites, no accounts.';

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const actor = await adminActor();
  if (actor === null) redirect('/admin');

  const selected = SubscriberStatusSchema.safeParse(status);
  const query = new URLSearchParams();
  if (selected.success) query.set('status', selected.data);
  if (q !== undefined && q !== '') query.set('q', q);

  const [stats, rows] = await Promise.all([
    fetchStats(actor),
    fetchRows(actor, query),
  ]);

  return (
    <main className="px-6 pt-5 pb-[26px]">
      <div className="flex flex-wrap items-center gap-[7px]">
        {stats === null ? null : (
          <StatusChips
            counts={stats}
            selected={selected.success ? selected.data : undefined}
          />
        )}
        <form method="get" className="ml-auto flex items-center gap-2">
          {selected.success && (
            <input type="hidden" name="status" value={selected.data} />
          )}
          <label className="sr-only" htmlFor="q">
            Search emails
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q ?? ''}
            placeholder="search emails…"
            className="input w-[200px]"
          />
          <Link href="/admin/compose" className="btn btn-primary">
            Compose update
          </Link>
        </form>
      </div>

      {rows === null || stats === null ? (
        <Unavailable />
      ) : (
        <WaitlistTable rows={rows} />
      )}

      <p className="mt-2 text-[10.5px] text-neutral-600">{FOOTER}</p>
    </main>
  );
}

function Unavailable() {
  return (
    <p className="mt-[14px] border border-divider p-[14px] text-[12px] text-neutral-600">
      The waitlist service did not answer. Nothing is lost — reload in a moment.
    </p>
  );
}

async function fetchStats(
  actor: string,
): Promise<WaitlistStatsResponse | null> {
  const response = await forwardAsAdmin(actor, '/v1/admin/waitlist/stats');
  if (!response.ok) return null;
  return WaitlistStatsResponseSchema.parse(await response.json());
}

async function fetchRows(actor: string, query: URLSearchParams) {
  const suffix = query.toString() === '' ? '' : `?${query.toString()}`;
  const response = await forwardAsAdmin(actor, `/v1/admin/waitlist${suffix}`);
  if (!response.ok) return null;
  return AdminWaitlistResponseSchema.parse(await response.json()).rows;
}
