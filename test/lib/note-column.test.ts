import { describe, expect, it } from 'vitest';

import { noteFor } from '@/lib/note-column';

import type { AdminWaitlistRow } from '@mboss/zod';

function row(over: Partial<AdminWaitlistRow>): AdminWaitlistRow {
  return {
    id: 'sub_1',
    email: 'pat@stmarks.org',
    source: 'email',
    status: 'subscribed',
    createdAt: '2026-08-02T12:00:00.000Z',
    sentCount: 0,
    ...over,
  };
}

describe('noteFor', () => {
  it('counts the updates a subscriber has had', () => {
    expect(noteFor(row({ sentCount: 3 }))).toBe('3 updates sent');
  });

  it('reads as singular at one', () => {
    expect(noteFor(row({ sentCount: 1 }))).toBe('1 update sent');
  });

  it('says so plainly at none', () => {
    expect(noteFor(row({ sentCount: 0 }))).toBe('no updates yet');
  });

  it('describes a paused row by what it does next', () => {
    expect(noteFor(row({ status: 'paused', sentCount: 3 }))).toBe(
      'skips updates',
    );
  });

  it('says nothing about an unsubscribed row', () => {
    expect(noteFor(row({ status: 'unsubscribed', sentCount: 3 }))).toBe('');
  });

  it('states a bounce as a fact about a send', () => {
    expect(noteFor(row({ status: 'bounced', sentCount: 3 }))).toBe(
      'delivery bounced',
    );
  });

  it('depends only on the current status', () => {
    // Status cycles: bounced → subscribed → bounced
    // is legal and repeatable, there is no bounce
    // counter on the wire and no bouncedAt, so a
    // "bounced N times" or "permanently removed" note
    // is not merely wrong, it is unbuildable. This is
    // what stops someone faking one.
    expect(noteFor(row({ status: 'bounced', sentCount: 9 }))).toBe(
      noteFor(row({ status: 'bounced', sentCount: 0 })),
    );
    expect(noteFor(row({ status: 'subscribed', sentCount: 3 }))).toBe(
      '3 updates sent',
    );
  });
});
