import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { seedEnv } from '../helpers/env.js';
import { stubFetch, type FetchStub } from '../helpers/fetch-stub.js';

const TOKEN = 'dev-web-service-token';

beforeAll(() => {
  seedEnv();
});

let fetchStub: FetchStub;

afterEach(() => {
  fetchStub.restore();
});

function signup(email: unknown): Request {
  return new Request('http://localhost:3000/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

const row = {
  email: 'pat@stmarks.org',
  status: 'subscribed',
  subscribedAt: '2026-08-09T12:00:00.000Z',
};

describe('POST /api/waitlist', () => {
  it('forwards to the private API with the service bearer', async () => {
    fetchStub = stubFetch();
    fetchStub.reply(row);
    const { POST } = await import('@/app/api/waitlist/route');

    await POST(signup('pat@stmarks.org'));

    expect(fetchStub.calls).toHaveLength(1);
    const [call] = fetchStub.calls;
    expect(call?.url).toBe('http://api:3001/v1/waitlist/signups');
    expect(call?.method).toBe('POST');
    expect(call?.headers.get('authorization')).toBe(`Bearer ${TOKEN}`);
    expect(call?.headers.get('content-type')).toBe('application/json');
    expect(call?.body).toBe('{"email":"pat@stmarks.org"}');
  });

  it('normalizes the address through the shared rule', async () => {
    // The trim and the lowercase belong to
    // @mboss/zod's emailSchema, so every service
    // agrees on what one address is.
    fetchStub = stubFetch();
    fetchStub.reply(row);
    const { POST } = await import('@/app/api/waitlist/route');

    await POST(signup('  PAT@StMarks.org '));

    expect(fetchStub.calls[0]?.body).toBe('{"email":"pat@stmarks.org"}');
  });

  it("returns the API's row", async () => {
    fetchStub = stubFetch();
    fetchStub.reply(row);
    const { POST } = await import('@/app/api/waitlist/route');

    const response = await POST(signup('pat@stmarks.org'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(row);
  });

  it('answers a previously bounced address with the ordinary body', async () => {
    // Signing up again is how someone leaves the
    // bounced state, so there is no branch here at
    // all — the API's answer is the answer.
    fetchStub = stubFetch();
    fetchStub.reply({ ...row, status: 'subscribed' });
    const { POST } = await import('@/app/api/waitlist/route');

    const response = await POST(signup('pat@stmarks.org'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: 'subscribed',
    });
  });

  it('rejects a malformed address without calling the API', async () => {
    fetchStub = stubFetch();
    const { POST } = await import('@/app/api/waitlist/route');

    const response = await POST(signup('not-an-address'));

    expect(response.status).toBe(400);
    expect(fetchStub.calls).toHaveLength(0);
  });

  it('maps an API failure to 502 without leaking its body', async () => {
    fetchStub = stubFetch();
    fetchStub.replyText('database is on fire at 10.0.0.4', 500);
    const { POST } = await import('@/app/api/waitlist/route');

    const response = await POST(signup('pat@stmarks.org'));

    expect(response.status).toBe(502);
    await expect(response.text()).resolves.not.toContain('10.0.0.4');
  });

  it('never puts the service token in the response', async () => {
    fetchStub = stubFetch();
    fetchStub.reply(row);
    const { POST } = await import('@/app/api/waitlist/route');

    const response = await POST(signup('pat@stmarks.org'));

    expect(await response.text()).not.toContain(TOKEN);
  });
});
