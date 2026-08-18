import { formatSubscribedAt } from '@/lib/format';
import { noteFor } from '@/lib/note-column';

import type { AdminWaitlistRow } from '@mboss/zod';

/**
 * Everyone on the list, in the machine face, with the
 * derived note as the last column.
 *
 * The status cell is the bare word. The mockup pairs
 * a paused row with the date it was paused, but no
 * date for that is on the wire — the row carries only
 * when someone joined — so the cell says what is
 * known rather than what would look complete.
 */

const LEAVING = { color: 'oklch(45% .09 30)' };

export function WaitlistTable({ rows }: { rows: AdminWaitlistRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="mono mt-[14px] border border-divider p-[14px] text-[11.5px] text-neutral-600">
        nobody here yet
      </p>
    );
  }

  return (
    <div className="mono mt-[14px] overflow-x-auto border border-divider text-[11.5px]">
      <table className="table w-full text-[11.5px]">
        <thead>
          <tr className="bg-neutral-100">
            <th>identity</th>
            <th>source</th>
            <th>joined</th>
            <th>status</th>
            <th>note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={row.status === 'paused' ? 'bg-accent-100' : undefined}
            >
              <td>{row.email}</td>
              <td>{row.source}</td>
              <td>{formatSubscribedAt(row.createdAt)}</td>
              <td style={row.status === 'unsubscribed' ? LEAVING : undefined}>
                {row.status}
              </td>
              <td className="text-neutral-600">{noteFor(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
