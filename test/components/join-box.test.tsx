// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { JoinBox } from '@/app/join-box';
import { stubFetch, type FetchStub } from '../helpers/fetch-stub.js';

let fetchStub: FetchStub;

afterEach(() => {
  cleanup();
  fetchStub.restore();
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
    // Nothing in the UI distinguishes a first
    // signup from a repeat: the API answers both
    // the same way, and saying "you were already on
    // the list" would leak membership to anyone who
    // guessed an address.
    fetchStub = stubFetch();
    fetchStub.reply(row);
    render(<JoinBox />);

    await join();

    expect(screen.getByText("You're on the list.")).toBeVisible();
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
