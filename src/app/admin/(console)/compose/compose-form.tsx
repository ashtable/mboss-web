'use client';

import { useState } from 'react';

import type { SubscriberStatus, WaitlistStatsResponse } from '@mboss/zod';

import { EmailPreview } from './email-preview';

/**
 * Writing a progress update. Two columns: the fields
 * on the left and the email itself on the right,
 * re-rendered on every keystroke.
 *
 * Sending is immediate; there is no scheduling. Once
 * a broadcast is away the send button is gone,
 * because a second click would create a second
 * broadcast and mail everyone twice.
 *
 * The teaser is a URL rather than an upload. There is
 * no object store behind this product, so an upload
 * control would be a promise nothing can keep.
 */

type Sent = { broadcast: boolean; message: string };

export function ComposeForm({
  counts,
  actor,
}: {
  counts: WaitlistStatsResponse;
  actor: string;
}) {
  const [subject, setSubject] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [includePaused, setIncludePaused] = useState(false);
  const [attachTeaser, setAttachTeaser] = useState(false);
  const [teaserImageUrl, setTeaserImageUrl] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recipients = counts.subscribed + (includePaused ? counts.paused : 0);
  const teaser = attachTeaser && teaserImageUrl !== '' ? teaserImageUrl : null;

  function draft(): Record<string, unknown> {
    return {
      subject,
      bodyMarkdown,
      ...(teaser === null ? {} : { teaserImageUrl: teaser }),
    };
  }

  async function send(path: string, body: unknown, message: Sent) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError('That did not go through. Nothing was sent.');
        return;
      }
      setSent(message);
    } catch {
      setError('That did not go through. Nothing was sent.');
    } finally {
      setPending(false);
    }
  }

  function sendBroadcast(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const audience: SubscriberStatus[] = includePaused
      ? ['subscribed', 'paused']
      : ['subscribed'];
    void send(
      '/api/admin/broadcasts',
      { ...draft(), audience },
      {
        broadcast: true,
        message: `Sending to ${recipients} ${plural(recipients)}.`,
      },
    );
  }

  function sendTest() {
    void send('/api/admin/broadcasts/test', draft(), {
      broadcast: false,
      message: `Test sent to ${actor}.`,
    });
  }

  return (
    <div className="flex flex-col gap-[18px] px-6 pt-5 pb-[26px] md:flex-row md:px-6">
      <form onSubmit={sendBroadcast} className="md:flex-[1.1]">
        <div className="eyebrow">AUDIENCE</div>
        <div className="mt-[6px] flex flex-wrap items-center gap-[7px]">
          <span className="bg-accent px-3 py-1 font-heading text-[12px] font-semibold tracking-[0.05em] text-white">
            SUBSCRIBED {counts.subscribed}
          </span>
          <label
            className={`cursor-pointer px-3 py-1 font-heading text-[12px] font-semibold tracking-[0.05em] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
              includePaused
                ? 'bg-accent text-white'
                : 'border border-divider text-neutral-600'
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={includePaused}
              onChange={(event) => setIncludePaused(event.target.checked)}
            />
            + PAUSED {counts.paused}
          </label>
        </div>

        <label htmlFor="subject" className="eyebrow mt-[14px] block">
          SUBJECT
        </label>
        <input
          id="subject"
          className="input mt-[5px]"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          required
        />

        <label htmlFor="message" className="eyebrow mt-3 block">
          MESSAGE
        </label>
        <textarea
          id="message"
          className="input mt-[5px] text-[12px]/[1.6]"
          value={bodyMarkdown}
          onChange={(event) => setBodyMarkdown(event.target.value)}
          required
        />

        <label className="mt-[10px] flex cursor-pointer items-center gap-2 text-[11px] text-neutral-700">
          <input
            type="checkbox"
            checked={attachTeaser}
            onChange={(event) => setAttachTeaser(event.target.checked)}
          />
          attach this week&apos;s teaser image
        </label>
        {attachTeaser && (
          <input
            type="url"
            aria-label="Teaser image URL"
            className="input mt-[6px]"
            placeholder="https://…"
            value={teaserImageUrl}
            onChange={(event) => setTeaserImageUrl(event.target.value)}
          />
        )}

        <div className="mt-[14px] flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={pending}
            onClick={sendTest}
          >
            Send test to me
          </button>
          {sent?.broadcast !== true && (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending}
            >
              Send to {recipients} {plural(recipients)}
            </button>
          )}
        </div>

        {sent !== null && (
          <p role="status" className="mt-2 text-[11px] text-neutral-600">
            {sent.message}
          </p>
        )}
        {error !== null && (
          <p role="alert" className="mt-2 text-[11px] text-[oklch(45%_.09_30)]">
            {error}
          </p>
        )}
      </form>

      <div className="md:w-[360px] md:flex-none">
        <div className="eyebrow">PREVIEW</div>
        <div className="mt-[6px]">
          <EmailPreview
            to={actor}
            subject={subject}
            bodyMarkdown={bodyMarkdown}
            teaserImageUrl={teaser}
          />
        </div>
      </div>
    </div>
  );
}

function plural(count: number): string {
  return count === 1 ? 'subscriber' : 'subscribers';
}
