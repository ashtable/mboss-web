import Link from 'next/link';

import type { SubscriberStatus, WaitlistStatsResponse } from '@mboss/zod';

/**
 * The filter across the top of the waitlist. ALL is
 * a view rather than a status — there is no `all` on
 * the wire — so selecting it drops the filter
 * instead of sending one the API would have to
 * special-case.
 */

const STATUSES: readonly SubscriberStatus[] = [
  'subscribed',
  'paused',
  'unsubscribed',
  'bounced',
];

export function StatusChips({
  counts,
  selected,
}: {
  counts: WaitlistStatsResponse;
  selected: SubscriberStatus | undefined;
}) {
  return (
    <div className="flex flex-wrap items-center gap-[7px]">
      <Chip
        label="ALL"
        count={counts.all}
        href="/admin/waitlist"
        current={selected === undefined}
      />
      {STATUSES.map((status) => (
        <Chip
          key={status}
          label={status.toUpperCase()}
          count={counts[status]}
          href={`/admin/waitlist?status=${status}`}
          current={selected === status}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  count,
  href,
  current,
}: {
  label: string;
  count: number;
  href: string;
  current: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className={`font-heading text-[12px] font-semibold tracking-[0.05em] no-underline ${
        current
          ? 'bg-accent px-3 py-1 text-white'
          : 'border border-divider px-3 py-1 text-neutral-600'
      }`}
    >
      {label} {count}
    </Link>
  );
}
