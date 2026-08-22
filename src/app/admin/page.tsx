import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { sessionAddress } from '@/auth/policy';
import { Blueprint } from '@/components/blueprint';

import { SignInButton } from './sign-in-button';

/**
 * The only sign-in anywhere on mboss.dev, and it is
 * for staff. There is no site nav here on purpose:
 * this page is a door, not a destination, and the
 * one link out of it goes to the waitlist.
 *
 * The card is blueprint-framed, like the waitlist
 * screens and unlike the console behind it: whoever
 * is looking at this page is still anonymous, so it
 * is a public surface reached from the public site,
 * not an operational one. Written down because the
 * frame's scope is a rule worth not re-arguing.
 */
export const metadata: Metadata = {
  title: 'Admin sign-in',
  robots: { index: false, follow: false },
};

export default async function AdminSignInPage() {
  if (sessionAddress(await auth()) !== null) redirect('/admin/waitlist');

  return (
    <main className="grid place-items-center px-6 py-[44px] pb-[52px]">
      <Blueprint className="w-full max-w-[400px] bg-white px-[26px] py-[22px]">
        <h2 className="text-[24px]">Admin sign-in</h2>
        <p className="mt-1 text-[12px] text-neutral-600">
          autoretryai.com staff only — for the waitlist console.
        </p>
        <div className="mt-[9px]">
          <SignInButton />
        </div>
        <div className="mono mt-[5px] text-[10px] text-neutral-500">
          e.g. ash@autoretryai.com · domain checked on callback
        </div>
        <p className="mt-3 border-t border-divider pt-[10px] text-[10.5px]/[1.5] text-neutral-600">
          There is no user sign-in anywhere on mboss.dev — the waitlist is
          email-only. <Link href="/">Join it here</Link>.
        </p>
      </Blueprint>
    </main>
  );
}
