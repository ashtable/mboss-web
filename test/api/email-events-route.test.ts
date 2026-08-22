import { createSign, generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { seedEnv } from '../helpers/env.js';
import { stubFetch, type FetchStub } from '../helpers/fetch-stub.js';

const { publicKey, privateKey } = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
});

const INTERNAL_TOKEN = 'dev-internal-api-token';
const TIMESTAMP = '1787000000';

beforeAll(() => {
  seedEnv({
    INTERNAL_API_TOKEN: INTERNAL_TOKEN,
    SENDGRID_WEBHOOK_PUBLIC_KEY: publicKey
      .export({ type: 'spki', format: 'der' })
      .toString('base64'),
  });
});

let fetchStub: FetchStub;

beforeEach(() => {
  fetchStub = stubFetch();
});

afterEach(() => {
  fetchStub.restore();
});

function signed(
  rawBody: string,
  headers: Record<string, string> = {},
): Request {
  const signer = createSign('SHA256');
  signer.update(TIMESTAMP + rawBody);
  signer.end();
  return new Request('http://localhost:3000/api/email/events', {
    method: 'POST',
    headers: {
      'x-twilio-email-event-webhook-signature': signer.sign(
        privateKey,
        'base64',
      ),
      'x-twilio-email-event-webhook-timestamp': TIMESTAMP,
      ...headers,
    },
    body: rawBody,
  });
}

const batch = JSON.stringify([
  { email: 'a@example.test', event: 'delivered', timestamp: 1787000001 },
  { email: 'b@example.test', event: 'bounce', timestamp: 1787000002 },
  { email: 'c@example.test', event: 'open', timestamp: 1787000003 },
  { email: 'd@example.test', event: 'spamreport', timestamp: 1787000004 },
]);

describe('POST /api/email/events', () => {
  it('forwards with the internal token, not the web one', async () => {
    // This is the only place this app crosses into
    // the API's internal surface, and the two tokens
    // are one typo apart.
    fetchStub.reply({ processed: 2, bounced: 1 });
    const { POST } = await import('@/app/api/email/events/route');

    const response = await POST(signed(batch));

    expect(response.status).toBe(200);
    expect(fetchStub.calls[0]?.url).toBe(
      'http://api:3001/internal/v1/email-events',
    );
    expect(fetchStub.calls[0]?.headers.get('authorization')).toBe(
      `Bearer ${INTERNAL_TOKEN}`,
    );
  });

  it('forwards only the events that change a subscriber', async () => {
    fetchStub.reply({ processed: 2, bounced: 1 });
    const { POST } = await import('@/app/api/email/events/route');

    await POST(signed(batch));

    expect(JSON.parse(fetchStub.calls[0]?.body ?? '[]')).toEqual([
      { email: 'b@example.test', event: 'bounce', timestamp: 1787000002 },
      { email: 'd@example.test', event: 'spamreport', timestamp: 1787000004 },
    ]);
  });

  it('normalizes addresses through the shared rule', async () => {
    fetchStub.reply({ processed: 1, bounced: 1 });
    const { POST } = await import('@/app/api/email/events/route');

    await POST(
      signed(
        JSON.stringify([
          { email: '  PAT@StMarks.org ', event: 'bounce', timestamp: 1 },
        ]),
      ),
    );

    expect(JSON.parse(fetchStub.calls[0]?.body ?? '[]')[0].email).toBe(
      'pat@stmarks.org',
    );
  });

  it('answers 200 without calling the API when nothing in the batch matters', async () => {
    // The internal schema takes a non-empty array, so
    // forwarding an empty batch would earn a 400 on
    // the most ordinary delivery there is.
    const { POST } = await import('@/app/api/email/events/route');

    const response = await POST(
      signed(
        JSON.stringify([
          { email: 'a@example.test', event: 'delivered', timestamp: 1 },
        ]),
      ),
    );

    expect(response.status).toBe(200);
    expect(fetchStub.calls).toHaveLength(0);
  });

  it('rejects an invalid signature and calls nothing', async () => {
    const { POST } = await import('@/app/api/email/events/route');

    const request = signed(batch, {
      'x-twilio-email-event-webhook-signature': 'AAAA',
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(fetchStub.calls).toHaveLength(0);
  });

  it('rejects a request with no signature headers', async () => {
    const { POST } = await import('@/app/api/email/events/route');

    const response = await POST(
      new Request('http://localhost:3000/api/email/events', {
        method: 'POST',
        body: batch,
      }),
    );

    expect(response.status).toBe(401);
    expect(fetchStub.calls).toHaveLength(0);
  });

  it('verifies before it parses', async () => {
    // A correctly signed body that is not JSON is a
    // 400, not a 401. Parsing first would mean
    // verifying bytes that are not the ones that
    // arrived.
    const { POST } = await import('@/app/api/email/events/route');

    const response = await POST(signed('not json at all'));

    expect(response.status).toBe(400);
    expect(fetchStub.calls).toHaveLength(0);
  });
});
