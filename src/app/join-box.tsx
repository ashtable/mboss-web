'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

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

  /**
   * Before hydration there is no `onSubmit` attached,
   * and Enter in the field would fall through to the
   * browser's own GET: the signup is dropped in
   * silence and the address lands in the URL, the
   * history and every later `Referer`. A disabled
   * submit button blocks implicit submission as well
   * as clicks, so this one flag shuts both doors.
   * Nothing is lost by it — the form has never worked
   * without JavaScript, since without it the success
   * card can never render.
   */
  const ready = useHydrated();

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
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!ready || pending}
        >
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
  /**
   * This card replaces the form the visitor was in,
   * so focus would otherwise fall to the body: a
   * screen reader would announce nothing and the next
   * Tab would restart at the top of the page. Moving
   * focus to the heading fixes both. `tabIndex={-1}`
   * makes the heading focusable in code without
   * adding it to the tab order, and the accent ring
   * is painted only when focus arrived by keyboard.
   */
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <Blueprint className="card mt-[22px] max-w-[400px] bg-white px-[26px] py-[22px] text-center">
      <span
        aria-hidden
        className="mx-auto grid h-[30px] w-[30px] place-items-center bg-accent font-heading text-[15px] font-semibold text-white"
      >
        ✓
      </span>
      <h2 ref={heading} tabIndex={-1} className="text-[26px]">
        You&apos;re on the list.
      </h2>
      <div className="mono text-[11px] text-neutral-600">
        subscribed {formatSubscribedAt(row.subscribedAt)} · {row.email}
      </div>
      <p className="text-[12.5px]/[1.55] text-neutral-600">{CARD_BODY}</p>
    </Blueprint>
  );
}

/**
 * False in the server-rendered HTML and through
 * hydration, true once React has taken the markup
 * over. `useSyncExternalStore` is how React itself
 * answers "which side am I on": it reads the server
 * snapshot until hydration finishes and the client
 * one after, from a store that never changes again —
 * hence the subscribe that unsubscribes to nothing.
 */
const noSubscription = () => () => {};
const onTheClient = () => true;
const onTheServer = () => false;

function useHydrated(): boolean {
  return useSyncExternalStore(noSubscription, onTheClient, onTheServer);
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
