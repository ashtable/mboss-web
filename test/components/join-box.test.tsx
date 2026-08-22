// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import { JoinBox } from '@/app/join-box';
import { stubFetch, type FetchStub } from '../helpers/fetch-stub.js';

let fetchStub: FetchStub;
let root: Root | null = null;

afterEach(async () => {
  cleanup();
  fetchStub.restore();
  // Unmounted here rather than in the test that
  // hydrates, so a failed assertion still tears down.
  if (root !== null) {
    const mounted = root;
    root = null;
    await act(async () => mounted.unmount());
  }
});

const row = {
  email: 'pat@stmarks.org',
  status: 'subscribed',
  subscribedAt: '2026-08-09T12:00:00.000Z',
};

async function join(): Promise<void> {
  const user = userEvent.setup();
  await user.type(
    screen.getByPlaceholderText('you@company.com'),
    'pat@stmarks.org',
  );
  await user.click(screen.getByRole('button', { name: 'Join waitlist' }));
}

describe('JoinBox', () => {
  it('renders the join box copy', () => {
    fetchStub = stubFetch();
    render(<JoinBox />);

    expect(screen.getByText('JOIN THE WAITLIST — EARLY DAYS')).toBeVisible();
    const input = screen.getByPlaceholderText('you@company.com');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toBeRequired();
    expect(screen.getByRole('button', { name: 'Join waitlist' })).toBeVisible();
    expect(
      screen.getByText(
        'progress emails as features land · unsubscribe anytime',
      ),
    ).toBeVisible();
  });

  it('ships the submit button disabled and enables it on hydration', async () => {
    // The server markup is exactly the DOM a visitor
    // can reach before hydration: no onSubmit is
    // attached yet, so an enabled submit button would
    // let Enter fall through to the browser's own GET,
    // dropping the signup and putting the address in
    // the URL. Both halves are asserted against one
    // button element, because a button that shipped
    // disabled and stayed that way would be the worse
    // bug of the two.
    fetchStub = stubFetch();
    // Detached on purpose: `screen` queries
    // document.body, and a second copy of the form
    // hanging off it would confuse every later test.
    const container = document.createElement('div');
    container.innerHTML = renderToString(<JoinBox />);
    const button = container.querySelector('button[type="submit"]');

    expect(button).toBeDisabled();

    root = await act(async () => hydrateRoot(container, <JoinBox />));

    // Same node, not a replacement: React adopted the
    // server's markup, so the enabling really is
    // hydration and not a mismatched re-render.
    expect(container.querySelector('button[type="submit"]')).toBe(button);
    expect(button).toBeEnabled();
  });

  it('swaps the box for the success card on submit', async () => {
    fetchStub = stubFetch();
    fetchStub.reply(row);
    render(<JoinBox />);

    await join();

    expect(screen.getByText("You're on the list.")).toBeVisible();
    expect(
      screen.getByText('subscribed aug 09 · pat@stmarks.org'),
    ).toBeVisible();
    expect(
      screen.getByText(
        "It's early days — the extension is still taking shape. We'll " +
          'email when the first pieces work, and again the day you can try ' +
          'it. Nothing else, ever.',
      ),
    ).toBeVisible();
    expect(screen.queryByPlaceholderText('you@company.com')).toBeNull();
  });

  it('shows the same card for a repeat signup', async () => {
    // A repeat is the same request with the same
    // answer — the one thing that differs is the
    // date, which stays the day they first joined.
    // Nothing in the UI distinguishes the two:
    // saying "you were already on the list" would
    // leak membership to anyone who guessed an
    // address, and a card that dated the row today
    // would quietly rewrite it.
    fetchStub = stubFetch();
    fetchStub.reply({ ...row, subscribedAt: '2026-03-02T09:14:00.000Z' });
    const { container } = render(<JoinBox />);

    await join();

    expect(screen.getByText("You're on the list.")).toBeVisible();
    expect(
      screen.getByText('subscribed mar 02 · pat@stmarks.org'),
    ).toBeVisible();

    expect((container.textContent ?? '').toLowerCase()).not.toContain(
      'already',
    );
  });

  it('shows no queue position anywhere', async () => {
    // There is no rank on the wire, so inventing
    // one would be a promise nothing can keep.
    fetchStub = stubFetch();
    fetchStub.reply(row);
    const { container } = render(<JoinBox />);

    await join();

    const text = container.textContent ?? '';
    expect(text).not.toMatch(/#\s*\d/);
    expect(text.toLowerCase()).not.toContain('position');
    expect(text.toLowerCase()).not.toContain("you're #");
  });

  it('keeps the form and shows an inline error when the signup fails', async () => {
    fetchStub = stubFetch();
    fetchStub.reply({ error: 'nope' }, 502);
    render(<JoinBox />);

    await join();

    expect(screen.getByPlaceholderText('you@company.com')).toBeVisible();
    expect(screen.getByRole('alert')).toBeVisible();
  });
});
