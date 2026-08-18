import type { AdminWaitlistRow } from '@mboss/zod';

/**
 * The last column of the waitlist table: one short
 * line saying what this row means operationally.
 *
 * It is a pure function of the row's *current*
 * status. Nothing on the wire records how many times
 * an address has bounced or when, and a status
 * cycles — bounced back to subscribed and out again
 * — so a "bounced three times" or "permanently
 * removed" note is not merely wrong here, it is
 * unbuildable. Bounced is phrased as a fact about a
 * send rather than a verdict on a person, because
 * signing up again is how someone leaves it.
 */
export function noteFor(row: AdminWaitlistRow): string {
  switch (row.status) {
    case 'subscribed':
      if (row.sentCount === 0) return 'no updates yet';
      return `${row.sentCount} update${row.sentCount === 1 ? '' : 's'} sent`;
    case 'paused':
      return 'skips updates';
    case 'bounced':
      return 'delivery bounced';
    case 'unsubscribed':
      return '';
  }
}
