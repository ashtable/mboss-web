'use client';

import { signOut } from 'next-auth/react';

/**
 * Signing out returns to the public site, not back to
 * the sign-in door — there is nothing for a signed-out
 * admin to do at /admin/waitlist, and the sign-in card
 * itself already links to "/".
 */
export function SignOutButton() {
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={() => void signOut({ callbackUrl: '/' })}
    >
      Sign out
    </button>
  );
}
