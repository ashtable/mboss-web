import { describe, expect, it } from 'vitest';

import { formatSubscribedAt } from '@/lib/format';

describe('formatSubscribedAt', () => {
  it('renders a lowercase month and day', () => {
    expect(formatSubscribedAt('2026-08-09T12:00:00.000Z')).toBe('aug 09');
  });

  it('pads a single-digit day', () => {
    expect(formatSubscribedAt('2026-08-02T12:00:00.000Z')).toBe('aug 02');
  });

  it('formats in UTC rather than local time', () => {
    // A card showing yesterday's date because the
    // server sits west of Greenwich is the bug this
    // pins.
    process.env.TZ = 'America/Los_Angeles';
    expect(formatSubscribedAt('2026-08-09T23:30:00.000Z')).toBe('aug 09');
  });
});
