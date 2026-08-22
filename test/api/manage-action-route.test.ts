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

function post(token: string, action: string) {
  return {
    request: new Request(
      `http://localhost:3000/api/manage/${token}/${action}`,
      {
        method: 'POST',
      },
    ),
    context: { params: Promise.resolve({ token, action }) },
  };
}

describe('POST /api/manage/[token]/[action]', () => {
  it.each([
    ['pause', 'paused'],
    ['resume', 'subscribed'],
    ['unsubscribe', 'unsubscribed'],
  ])('forwards %s to its matching API path', async (action, status) => {
    fetchStub = stubFetch();
    fetchStub.reply({ status });
    const { POST } = await import('@/app/api/manage/[token]/[action]/route');

    const { request, context } = post('opaque-token', action);
    const response = await POST(request, context);

    expect(fetchStub.calls[0]?.url).toBe(
      `http://api:3001/v1/waitlist/manage/opaque-token/${action}`,
    );
    expect(fetchStub.calls[0]?.method).toBe('POST');
    expect(fetchStub.calls[0]?.headers.get('authorization')).toBe(
      `Bearer ${TOKEN}`,
    );
    await expect(response.json()).resolves.toEqual({ status });
  });

  it('answers an unknown action with 404 and calls nothing', async () => {
    // The segment is checked against a literal union
    // before it is ever interpolated into a URL.
    // Pasting a path segment straight from the
    // request into one is how a proxy becomes a
    // path-traversal gadget.
    fetchStub = stubFetch();
    const { POST } = await import('@/app/api/manage/[token]/[action]/route');

    const { request, context } = post('opaque-token', '../../admin/waitlist');
    const response = await POST(request, context);

    expect(response.status).toBe(404);
    expect(fetchStub.calls).toHaveLength(0);
  });

  it('passes the token through opaquely', async () => {
    // The token is the API's to verify. This app
    // holds no key ring and never decodes one.
    fetchStub = stubFetch();
    fetchStub.reply({ status: 'paused' });
    const { POST } = await import('@/app/api/manage/[token]/[action]/route');

    const weird = 'v1.abc-DEF_123.signature';
    const { request, context } = post(weird, 'pause');
    await POST(request, context);

    expect(fetchStub.calls[0]?.url).toContain(`/manage/${weird}/pause`);
  });

  it("passes the API's 404 through", async () => {
    fetchStub = stubFetch();
    fetchStub.replyText('', 404);
    const { POST } = await import('@/app/api/manage/[token]/[action]/route');

    const { request, context } = post('opaque-token', 'pause');
    const response = await POST(request, context);

    expect(response.status).toBe(404);
  });
});
