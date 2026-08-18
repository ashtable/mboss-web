'use client';

import { signIn } from 'next-auth/react';

/**
 * The whole of the sign-in page's interactivity.
 * Everything that decides whether an account is
 * allowed happens on the callback, server-side.
 */
export function SignInButton() {
  return (
    <button
      type="button"
      className="btn btn-primary btn-block"
      onClick={() => void signIn('microsoft-entra-id')}
    >
      Continue with Microsoft 365
    </button>
  );
}
