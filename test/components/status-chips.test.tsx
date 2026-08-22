// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { StatusChips } from '@/app/admin/(console)/waitlist/status-chips';

afterEach(cleanup);

const counts = {
  all: 214,
  subscribed: 201,
  paused: 9,
  unsubscribed: 3,
  bounced: 1,
};

describe('StatusChips', () => {
  it('shows every status with its live count', () => {
    render(<StatusChips counts={counts} selected={undefined} />);

    for (const label of [
      'ALL 214',
      'SUBSCRIBED 201',
      'PAUSED 9',
      'UNSUBSCRIBED 3',
      'BOUNCED 1',
    ]) {
      expect(screen.getByRole('link', { name: label })).toBeVisible();
    }
  });

  it('treats ALL as a view rather than a status', () => {
    // There is no `all` status on the wire. Selecting
    // it drops the filter instead of inventing one.
    render(<StatusChips counts={counts} selected="paused" />);

    expect(screen.getByRole('link', { name: 'ALL 214' })).toHaveAttribute(
      'href',
      '/admin/waitlist',
    );
    expect(screen.getByRole('link', { name: 'PAUSED 9' })).toHaveAttribute(
      'href',
      '/admin/waitlist?status=paused',
    );
  });

  it('fills the selected chip and outlines the rest', () => {
    render(<StatusChips counts={counts} selected="paused" />);

    expect(screen.getByRole('link', { name: 'PAUSED 9' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'ALL 214' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks ALL as selected when nothing is filtered', () => {
    render(<StatusChips counts={counts} selected={undefined} />);

    expect(screen.getByRole('link', { name: 'ALL 214' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
