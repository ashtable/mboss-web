'use client';

import { useState } from 'react';

import {
  ManageActionResponseSchema,
  type ManageStateResponse,
  type SubscriberStatus,
} from '@mboss/zod';

import { formatSubscribedAt } from '@/lib/format';

/**
 * What someone sees after following the link in one
 * of our emails. It is a plain bordered card, not a
 * blueprint-framed one: the frame belongs to the
 * public pages, and the difference is how a reader
 * can tell they arrived somewhere private.
 *
 * The buttons offered are the ones that would change
 * something. Bounced counts as unsubscribed here —
 * it is a verdict from a mail server rather than a
 * decision they made, and resuming is the way out of
 * it.
 *
 * The width is a maximum rather than a fixed size.
 * Most people open this from an email on a phone,
 * and a fixed width inside the centring grid makes
 * the track as wide as the card and scrolls the
 * whole document sideways.
 */

const BODY =
  'mBoss is early — this list exists only to tell you when things start ' +
  'coming together. Pause or leave any time; the signed link in every ' +
  'email brings you back here.';

const LEAVING = {
  color: 'oklch(45% .09 30)',
  borderColor: 'oklch(52% .09 30 / .45)',
};

type Action = 'pause' | 'resume' | 'unsubscribe';

export function ManageCard({
  token,
  state,
}: {
  token: string;
  state: ManageStateResponse;
}) {
  const [status, setStatus] = useState<SubscriberStatus>(state.status);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function act(action: Action) {
    setPending(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/manage/${token}/${action}`, {
        method: 'POST',
      });
      if (!response.ok) {
        setFailed(true);
        return;
      }
      const body = ManageActionResponseSchema.parse(await response.json());
      setStatus(body.status);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-[430px] border border-divider bg-white px-[26px] py-[22px] text-center">
      <span className="tag tag-outline px-[9px] py-[2px] text-[10px]">
        status: {status}
      </span>
      <h2 className="mt-[10px] text-[26px]">Your updates, your call.</h2>
      <p className="mt-2 text-[12.5px]/[1.6] text-neutral-600">{BODY}</p>
      <div className="mono mt-[10px] text-[11px] text-neutral-500">
        subscribed {formatSubscribedAt(state.subscribedAt)} · {state.email}
      </div>
      <div className="mt-[14px] flex justify-center gap-2">
        {status === 'subscribed' ? (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={pending}
            onClick={() => act('pause')}
          >
            Pause updates
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={pending}
            onClick={() => act('resume')}
          >
            Resume updates
          </button>
        )}
        {(status === 'subscribed' || status === 'paused') && (
          <button
            type="button"
            className="btn btn-secondary"
            style={LEAVING}
            disabled={pending}
            onClick={() => act('unsubscribe')}
          >
            Unsubscribe
          </button>
        )}
      </div>
      {failed && (
        <p role="alert" className="mt-2 text-[11px]" style={LEAVING}>
          That did not go through. Try again in a moment.
        </p>
      )}
    </div>
  );
}
