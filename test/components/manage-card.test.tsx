// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { ManageCard } from '@/app/u/[token]/manage-card';
import { stubFetch, type FetchStub } from '../helpers/fetch-stub.js';

import type { SubscriberStatus } from '@mboss/zod';

let fetchStub: FetchStub;

afterEach(() => {
  cleanup();
  fetchStub.restore();
});

function renderCard(status: SubscriberStatus) {
  return render(
    <ManageCard
      token="opaque-token"
      state={{
        email: 'pat@stmarks.org',
        status,
        subscribedAt: '2026-08-02T12:00:00.000Z',
      }}
    />,
  );
}

function buttonNames(): string[] {
  return screen
    .getAllByRole('button')
    .map((button) => button.textContent ?? '');
}

describe('ManageCard', () => {
  it('offers pause and unsubscribe while subscribed', () => {
    fetchStub = stubFetch();
    renderCard('subscribed');

    expect(screen.getByText('status: subscribed')).toBeVisible();
    expect(buttonNames()).toEqual(['Pause updates', 'Unsubscribe']);
  });

  it('offers resume and unsubscribe while paused', () => {
    fetchStub = stubFetch();
    renderCard('paused');

    expect(screen.getByText('status: paused')).toBeVisible();
    expect(buttonNames()).toEqual(['Resume updates', 'Unsubscribe']);
  });

  it('offers only resume once unsubscribed', () => {
    // The rule is to offer the actions that change
    // something.
    fetchStub = stubFetch();
    renderCard('unsubscribed');

    expect(screen.getByText('status: unsubscribed')).toBeVisible();
    expect(buttonNames()).toEqual(['Resume updates']);
  });

  it('treats bounced like unsubscribed', () => {
    // Bouncing is a verdict from a mail server, not a
    // decision the subscriber made, and resuming is
    // the way out of it.
    fetchStub = stubFetch();
    renderCard('bounced');

    expect(screen.getByText('status: bounced')).toBeVisible();
    expect(buttonNames()).toEqual(['Resume updates']);
  });

  it('posts the action and re-renders from the returned status', async () => {
    fetchStub = stubFetch();
    fetchStub.reply({ status: 'paused' });
    renderCard('subscribed');

    await userEvent.click(
      screen.getByRole('button', { name: 'Pause updates' }),
    );

    expect(fetchStub.calls[0]?.url).toBe('/api/manage/opaque-token/pause');
    expect(fetchStub.calls[0]?.method).toBe('POST');
    expect(screen.getByText('status: paused')).toBeVisible();
    expect(buttonNames()).toEqual(['Resume updates', 'Unsubscribe']);
  });

  it('is not blueprint-framed', () => {
    // The plain divider border is the tell that this
    // page was reached through a private link rather
    // than the public front door, and it is exactly
    // the kind of difference someone "fixes" into
    // consistency without knowing it carries meaning.
    fetchStub = stubFetch();
    const { container } = renderCard('subscribed');

    expect(container.querySelector('.blueprint')).toBeNull();
    expect(container.querySelector('.corner')).toBeNull();
  });

  it('renders the meta line as a date and address', () => {
    fetchStub = stubFetch();
    renderCard('subscribed');

    expect(
      screen.getByText('subscribed aug 02 · pat@stmarks.org'),
    ).toBeVisible();
  });
});
