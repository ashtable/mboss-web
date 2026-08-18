// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { renderBroadcastEmail } from '@mboss/core/email';

import { ComposeForm } from '@/app/admin/(console)/compose/compose-form';
import { stubFetch, type FetchStub } from '../helpers/fetch-stub.js';

let fetchStub: FetchStub;

afterEach(() => {
  cleanup();
  fetchStub.restore();
});

const counts = {
  all: 214,
  subscribed: 201,
  paused: 9,
  unsubscribed: 3,
  bounced: 1,
};

function renderForm() {
  fetchStub = stubFetch();
  return render(<ComposeForm counts={counts} actor="ash@autoretryai.com" />);
}

async function compose(subject: string, body: string): Promise<void> {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('SUBJECT'), subject);
  await user.type(screen.getByLabelText('MESSAGE'), body);
}

describe('ComposeForm', () => {
  it('tracks the audience in the send button', async () => {
    // Only subscribed and paused can receive a
    // broadcast, so those are the only two the count
    // can include.
    renderForm();

    expect(
      screen.getByRole('button', { name: 'Send to 201 subscribers' }),
    ).toBeVisible();

    await userEvent.click(screen.getByLabelText('+ PAUSED 9'));

    expect(
      screen.getByRole('button', { name: 'Send to 210 subscribers' }),
    ).toBeVisible();
  });

  it('takes the teaser as a URL and offers no upload', async () => {
    // There is no object store behind this product,
    // so an upload control would be a promise nothing
    // can keep.
    const { container } = renderForm();

    await userEvent.click(
      screen.getByLabelText("attach this week's teaser image"),
    );

    expect(container.querySelector('input[type="url"]')).not.toBeNull();
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });

  it('posts the create body', async () => {
    renderForm();
    fetchStub.reply({ id: 'bc_1', status: 'sending' });

    await compose('Progress update #3', 'The canvas is alive.');
    await userEvent.click(
      screen.getByRole('button', { name: 'Send to 201 subscribers' }),
    );

    expect(fetchStub.calls[0]?.url).toBe('/api/admin/broadcasts');
    expect(JSON.parse(fetchStub.calls[0]?.body ?? '{}')).toEqual({
      subject: 'Progress update #3',
      bodyMarkdown: 'The canvas is alive.',
      audience: ['subscribed'],
    });
  });

  it('sends a test through the route that knows who is signed in', async () => {
    // The recipient is never in the body: the route
    // fills it from the session.
    renderForm();
    fetchStub.reply({ enqueued: true });

    await compose('Progress update #3', 'The canvas is alive.');
    await userEvent.click(
      screen.getByRole('button', { name: 'Send test to me' }),
    );

    expect(fetchStub.calls[0]?.url).toBe('/api/admin/broadcasts/test');
    expect(JSON.parse(fetchStub.calls[0]?.body ?? '{}').to).toBeUndefined();
  });

  it('previews with the same renderer the worker sends with', async () => {
    // Nothing is snapshotted here. The bytes belong
    // to @mboss/core/email, and a copy of its
    // snapshot in this repo would be the drift the
    // shared module exists to prevent.
    const { container } = renderForm();

    await compose('Progress update #3', '# The canvas is alive.');

    const expected = renderBroadcastEmail({
      to: 'ash@autoretryai.com',
      subject: 'Progress update #3',
      bodyMarkdown: '# The canvas is alive.',
      teaserImageUrl: null,
      links: null,
    }).html;
    expect(container.querySelector('iframe')).toHaveAttribute(
      'srcdoc',
      expected,
    );
  });
});
