import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';

import { AdminNav } from './admin-nav';

/**
 * The console lives in a route group so this gate
 * wraps /admin/waitlist and /admin/compose without
 * wrapping /admin itself — a gate on the sign-in page
 * would send it to itself.
 *
 * The session is checked here as well as in the
 * proxy. The proxy redirects people; it is not the
 * authorization boundary, and this is the closest
 * check to the data.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const email = session?.user?.email;
  if (email === undefined || email === null) redirect('/admin');

  return (
    <>
      <AdminNav email={email} />
      {children}
    </>
  );
}
