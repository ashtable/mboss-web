import { vi } from 'vitest';

/**
 * Replaces global `fetch` with a recorder that
 * answers from a queue of scripted responses and
 * throws on anything it was not told to expect.
 * The throw is the point: no test in this suite may
 * reach the network, and a handler that grows an
 * extra call should fail loudly rather than hang.
 */

export type RecordedCall = {
  url: string;
  method: string;
  headers: Headers;
  body: string | undefined;
};

export type FetchStub = {
  calls: RecordedCall[];
  reply: (body: unknown, status?: number) => void;
  replyText: (body: string, status?: number) => void;
  restore: () => void;
};

export function stubFetch(): FetchStub {
  const calls: RecordedCall[] = [];
  const queue: Response[] = [];

  const stub = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      calls.push({
        url: String(input),
        method: init?.method ?? 'GET',
        headers: new Headers(init?.headers),
        body: typeof init?.body === 'string' ? init.body : undefined,
      });
      const scripted = queue.shift();
      if (scripted === undefined) {
        throw new Error(`unscripted fetch: ${init?.method ?? 'GET'} ${input}`);
      }
      return scripted;
    },
  );

  vi.stubGlobal('fetch', stub);

  return {
    calls,
    reply: (body, status = 200) => {
      queue.push(Response.json(body, { status }));
    },
    replyText: (body, status = 200) => {
      queue.push(new Response(body, { status }));
    },
    restore: () => {
      vi.unstubAllGlobals();
    },
  };
}
