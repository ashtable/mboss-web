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

function oneClick(body: BodyInit | null) {
  const token = 'opaque-token';
  return {
    request: new Request(`http://localhost:3000/api/unsubscribe/${token}`, {
      method: 'POST',
      body,
    }),
    context: { params: Promise.resolve({ token }) },
  };
}

describe('POST /api/unsubscribe/[token]', () => {
  it('unsubscribes on a one-click form post', async () => {
    fetchStub = stubFetch();
    fetchStub.reply({ status: 'unsubscribed' });
    const { POST } = await import('@/app/api/unsubscribe/[token]/route');

    const { request, context } = oneClick('List-Unsubscribe=One-Click');
    const response = await POST(request, context);

    expect(response.status).toBe(200);
    expect(fetchStub.calls[0]?.url).toBe(
      'http://api:3001/v1/waitlist/manage/opaque-token/unsubscribe',
    );
  });

  it('unsubscribes on an empty body too', async () => {
    // The signed token is the credential. Refusing
    // because a particular mail client formats the
    // body differently would strand the one request
    // that must never fail.
    fetchStub = stubFetch();
    fetchStub.reply({ status: 'unsubscribed' });
    const { POST } = await import('@/app/api/unsubscribe/[token]/route');

    const { request, context } = oneClick(null);
    const response = await POST(request, context);

    expect(response.status).toBe(200);
    expect(fetchStub.calls).toHaveLength(1);
  });

  it('renders no UI and issues no redirect', async () => {
    // Nothing reads this response: the mail provider
    // fires it in the background.
    fetchStub = stubFetch();
    fetchStub.reply({ status: 'unsubscribed' });
    const { POST } = await import('@/app/api/unsubscribe/[token]/route');

    const { request, context } = oneClick(null);
    const response = await POST(request, context);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    await expect(response.text()).resolves.toBe('');
  });
});
