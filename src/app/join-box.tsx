'use client';

import { useState } from 'react';

import {
  WaitlistSignupResponseSchema,
  type WaitlistSignupResponse,
} from '@mboss/zod';

import { Blueprint } from '@/components/blueprint';
import { formatSubscribedAt } from '@/lib/format';

/**
 * The only interactive thing on the landing page,
 * and the only state it has: no address yet, or the
 * row the API answered with. Joining does not
 * change the URL — the card belongs to this page,
 * not to a second one.
 *
 * There is deliberately nothing here that
 * distinguishes a first signup from a repeat.
 * Signing up is idempotent, and a "you were already
 * on the list" message would tell anyone who
 * guessed an address whether it is on it.
 */

const CARD_BODY =
  "It's early days — the extension is still taking shape. We'll email " +
  'when the first pieces work, and again the day you can try it. ' +
  'Nothing else, ever.';

const UNREACHABLE = 'Could not reach the waitlist. Try again in a moment.';

export function JoinBox() {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState<WaitlistSignupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(messageFrom(body));
        return;
      }
      setJoined(WaitlistSignupResponseSchema.parse(body));
    } catch {
      setError(UNREACHABLE);
    } finally {
      setPending(false);
    }
  }

  if (joined !== null) return <SuccessCard row={joined} />;

  return (
    <Blueprint className="card mt-[22px] max-w-[400px] bg-white px-4 py-[14px]">
      <div className="eyebrow">JOIN THE WAITLIST — EARLY DAYS</div>
      <form onSubmit={submit} className="flex gap-2">
        <label className="sr-only" htmlFor="join-email">
          Email address
        </label>
        <input
          id="join-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input flex-1"
        />
        <button type="submit" className="btn btn-primary" disabled={pending}>
          Join waitlist
        </button>
      </form>
      {error !== null && (
        <p role="alert" className="text-[11px] text-[oklch(45%_.09_30)]">
          {error}
        </p>
      )}
      <div className="mono text-[10px] text-neutral-500">
        progress emails as features land · unsubscribe anytime
      </div>
    </Blueprint>
  );
}

function SuccessCard({ row }: { row: WaitlistSignupResponse }) {
  return (
    <Blueprint className="card mt-[22px] max-w-[400px] bg-white px-[26px] py-[22px] text-center">
      <span
        aria-hidden
        className="mx-auto grid h-[30px] w-[30px] place-items-center bg-accent font-heading text-[15px] font-semibold text-white"
      >
        ✓
      </span>
      <h2 className="text-[26px]">You&apos;re on the list.</h2>
      <div className="mono text-[11px] text-neutral-600">
        subscribed {formatSubscribedAt(row.subscribedAt)} · {row.email}
      </div>
      <p className="text-[12.5px]/[1.55] text-neutral-600">{CARD_BODY}</p>
    </Blueprint>
  );
}

function messageFrom(body: unknown): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'string'
  ) {
    return body.error;
  }
  return UNREACHABLE;
}
