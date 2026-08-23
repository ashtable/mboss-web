// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/waitlist',
}));

const signOut = vi.fn();
vi.mock('next-auth/react', () => ({
  signOut: (...args: unknown[]) => signOut(...args),
}));

import { AdminNav } from '@/app/admin/(console)/admin-nav';

afterEach(() => {
  cleanup();
  signOut.mockClear();
});

describe('AdminNav', () => {
  it('offers a way to sign out', () => {
    render(<AdminNav email="ash@autoretryai.com" />);

    expect(screen.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });

  it('signs out to the public site, not back to the sign-in door', async () => {
    const user = userEvent.setup();
    render(<AdminNav email="ash@autoretryai.com" />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
  });
});
