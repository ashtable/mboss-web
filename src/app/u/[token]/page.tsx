import type { Metadata } from 'next';

import { SiteNav } from '@/components/site-nav';
import { fetchManageState } from '@/lib/manage';

import { ManageCard } from './manage-card';

/**
 * The page every mBoss email links to. Rendered per
 * request and never cached: one subscriber's state
 * must never be served to another, and the token in
 * the path is the only thing separating them.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your mBoss updates',
  // A private link has no business in a search
  // index.
  robots: { index: false, follow: false },
};

export default async function ManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const state = await fetchManageState(token);

  return (
    <>
      <SiteNav>
        {state !== null && (
          <span className="mono ml-auto text-[11px] text-neutral-600">
            {state.email} · via email link
          </span>
        )}
      </SiteNav>
      <main className="grid place-items-center px-6 py-[52px]">
        {state === null ? (
          <LinkError />
        ) : (
          <ManageCard token={token} state={state} />
        )}
      </main>
    </>
  );
}

/**
 * One state for every reason a link can fail. The
 * API answers forged, revoked, expired and
 * never-issued identically, so this says what to do
 * next without saying — or knowing — which one
 * happened.
 */
function LinkError() {
  return (
    <div className="w-full max-w-[430px] border border-divider bg-white px-[26px] py-[22px] text-center">
      <h2 className="text-[26px]">That link doesn&apos;t work.</h2>
      <p className="mt-2 text-[12.5px]/[1.6] text-neutral-600">
        Manage links are signed, and they can expire or be replaced. Open the
        one in the most recent mBoss email you have — every email carries a
        fresh link.
      </p>
    </div>
  );
}
