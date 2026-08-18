/**
 * Dates read the way the design writes them —
 * `aug 09`, lowercase, zero-padded — and always in
 * UTC. The alternative renders a subscriber's own
 * join date differently depending on where the
 * server happens to sit.
 */
const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: '2-digit',
});

export function formatSubscribedAt(iso: string): string {
  return formatter.format(new Date(iso)).toLowerCase();
}
