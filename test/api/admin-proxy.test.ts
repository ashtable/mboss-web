import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { seedEnv } from '../helpers/env.js';
import { stubFetch, type FetchStub } from '../helpers/fetch-stub.js';

vi.mock('@/auth', () => ({ auth: vi.fn() }));

const TOKEN = 'dev-web-service-token';
const ACTOR = 'ash@autoretryai.com';

beforeAll(() => {
  seedEnv();
});

let fetchStub: FetchStub;

beforeEach(() => {
  fetchStub = stubFetch();
});

afterEach(() => {
  fetchStub.restore();
  vi.clearAllMocks();
});

async function signIn(email: string | null): Promise<void> {
  // `auth` is overloaded — it is both the session
  // reader and the proxy wrapper — so the mock is
  // reached through the plain function shape.
  const { auth } = await import('@/auth');
  const mock = auth as unknown as ReturnType<typeof vi.fn>;
  mock.mockResolvedValue(email === null ? null : { user: { email } });
}

function get(url: string): Request {
  return new Request(url);
}

function post(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const broadcast = {
  subject: 'Progress update #3 — the canvas is alive',
  bodyMarkdown: '# The canvas is alive.',
  audience: ['subscribed'],
};

/**
 * Every handler under /api/admin/ is a proxy holding
 * a token the browser must never see, so the session
 * check is the one thing none of them may forget.
 */
const handlers = [
  [
    'waitlist',
    '@/app/api/admin/waitlist/route',
    'GET',
    () => get('http://localhost:3000/api/admin/waitlist'),
    { rows: [] },
  ],
  [
    'waitlist stats',
    '@/app/api/admin/waitlist/stats/route',
    'GET',
    () => get('http://localhost:3000/api/admin/waitlist/stats'),
    { all: 0, subscribed: 0, paused: 0, unsubscribed: 0, bounced: 0 },
  ],
  [
    'broadcast creation',
    '@/app/api/admin/broadcasts/route',
    'POST',
    () => post('http://localhost:3000/api/admin/broadcasts', broadcast),
    { id: 'bc_1', status: 'sending' },
  ],
  [
    'the test send',
    '@/app/api/admin/broadcasts/test/route',
    'POST',
    () => post('http://localhost:3000/api/admin/broadcasts/test', broadcast),
    { enqueued: true },
  ],
] as const;

describe('the admin proxies', () => {
  it.each(handlers)(
    '%s answers 401 with no session and forwards nothing',
    async (_name, modulePath, method, request) => {
      await signIn(null);
      const route = await import(modulePath);
      const handler = route[method] as (request: Request) => Promise<Response>;

      const response = await handler(request());

      expect(response.status).toBe(401);
      expect(fetchStub.calls).toHaveLength(0);
    },
  );

  it.each(handlers)(
    '%s forwards with both the bearer and the actor',
    async (_name, modulePath, method, request, reply) => {
      // The API authenticates on the bearer and takes
      // the actor header as audit data only, so a bug
      // that drops the bearer while keeping the header
      // fails closed at the API rather than open.
      await signIn(ACTOR);
      fetchStub.reply(reply);
      const route = await import(modulePath);
      const handler = route[method] as (request: Request) => Promise<Response>;

      await handler(request());

      const call = fetchStub.calls[0];
      expect(call?.headers.get('authorization')).toBe(`Bearer ${TOKEN}`);
      expect(call?.headers.get('x-admin-actor')).toBe(ACTOR);
    },
  );
});

describe('GET /api/admin/waitlist', () => {
  it('rebuilds the query string from an allowlist', async () => {
    // Anything the client adds is dropped rather than
    // handed to the API to interpret.
    await signIn(ACTOR);
    fetchStub.reply({ rows: [] });
    const { GET } = await import('@/app/api/admin/waitlist/route');

    await GET(
      get('http://localhost:3000/api/admin/waitlist?status=paused&q=a&evil=1'),
    );

    expect(fetchStub.calls[0]?.url).toBe(
      'http://api:3001/v1/admin/waitlist?status=paused&q=a',
    );
  });
});

describe('POST /api/admin/broadcasts', () => {
  it('forwards the validated body', async () => {
    await signIn(ACTOR);
    fetchStub.reply({ id: 'bc_1', status: 'sending' });
    const { POST } = await import('@/app/api/admin/broadcasts/route');

    const response = await POST(
      post('http://localhost:3000/api/admin/broadcasts', broadcast),
    );

    expect(JSON.parse(fetchStub.calls[0]?.body ?? '{}')).toEqual(broadcast);
    await expect(response.json()).resolves.toEqual({
      id: 'bc_1',
      status: 'sending',
    });
  });

  it('rejects an invalid body without calling the API', async () => {
    await signIn(ACTOR);
    const { POST } = await import('@/app/api/admin/broadcasts/route');

    const response = await POST(
      post('http://localhost:3000/api/admin/broadcasts', {
        subject: '',
        bodyMarkdown: '',
        audience: [],
      }),
    );

    expect(response.status).toBe(400);
    expect(fetchStub.calls).toHaveLength(0);
  });
});

describe('POST /api/admin/broadcasts/test', () => {
  it('sends the test to the signed-in admin, whatever the client asked for', async () => {
    // "Send test to me" means me. Taking the address
    // from the body would let the console be pointed
    // at anyone.
    await signIn(ACTOR);
    fetchStub.reply({ enqueued: true });
    const { POST } = await import('@/app/api/admin/broadcasts/test/route');

    await POST(
      post('http://localhost:3000/api/admin/broadcasts/test', {
        ...broadcast,
        to: 'someone.else@example.test',
      }),
    );

    expect(JSON.parse(fetchStub.calls[0]?.body ?? '{}').to).toBe(ACTOR);
  });
});
