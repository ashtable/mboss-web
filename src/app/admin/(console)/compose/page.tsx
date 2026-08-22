import { redirect } from 'next/navigation';

import { WaitlistStatsResponseSchema } from '@mboss/zod';

import { adminActor, forwardAsAdmin } from '@/lib/admin-proxy';

import { ComposeForm } from './compose-form';

/**
 * Writing the next progress update. The counts are
 * read here so the send button can name a real
 * number the moment the page arrives.
 */
export const dynamic = 'force-dynamic';

export default async function AdminComposePage() {
  const actor = await adminActor();
  if (actor === null) redirect('/admin');

  const response = await forwardAsAdmin(actor, '/v1/admin/waitlist/stats');
  if (!response.ok) {
    return (
      <main className="px-6 pt-5 pb-[26px]">
        <p className="border border-divider p-[14px] text-[12px] text-neutral-600">
          The waitlist service did not answer, so there is no audience to send
          to yet. Reload in a moment.
        </p>
      </main>
    );
  }

  const counts = WaitlistStatsResponseSchema.parse(await response.json());
  return <ComposeForm counts={counts} actor={actor} />;
}
