import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { seedEnv } from '../helpers/env.js';
import { stubFetch, type FetchStub } from '../helpers/fetch-stub.js';

beforeAll(() => {
  seedEnv();
});

let fetchStub: FetchStub;

afterEach(() => {
  fetchStub.restore();
});

const state = {
  email: 'pat@stmarks.org',
  status: 'subscribed',
  subscribedAt: '2026-08-02T12:00:00.000Z',
};

describe('fetchManageState', () => {
  it('parses a 200 into the manage state', async () => {
    fetchStub = stubFetch();
    fetchStub.reply(state);
    const { fetchManageState } = await import('@/lib/manage');

    await expect(fetchManageState('opaque-token')).resolves.toEqual(state);
    expect(fetchStub.calls[0]?.url).toBe(
      'http://api:3001/v1/waitlist/manage/opaque-token',
    );
  });

  it('returns null on a 404 rather than throwing', async () => {
    // The API answers every rejection — forged,
    // revoked, expired, wrong type, never existed —
    // with the same 404, and the page renders one
    // error state for all of them. Telling them
    // apart would tell a stranger whether an address
    // is on the list.
    fetchStub = stubFetch();
    fetchStub.replyText('', 404);
    const { fetchManageState } = await import('@/lib/manage');

    await expect(fetchManageState('opaque-token')).resolves.toBeNull();
  });

  it('throws on any other status', async () => {
    // A 500 is an outage, not "your link is bad",
    // and saying the wrong one sends someone hunting
    // for an email that was fine.
    fetchStub = stubFetch();
    fetchStub.replyText('', 500);
    const { fetchManageState } = await import('@/lib/manage');

    await expect(fetchManageState('opaque-token')).rejects.toThrow();
  });
});
