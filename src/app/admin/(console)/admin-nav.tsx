'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * The console's own nav. It is a client component
 * only so the current section can mark itself — the
 * links themselves are ordinary navigation.
 */
export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <nav className="nav border-b border-divider bg-white">
      <Link href="/admin/waitlist" className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="grid h-[19px] w-[19px] place-items-center bg-accent font-heading text-[11px] font-semibold text-white"
        >
          m
        </span>
        <span className="nav-brand">mBoss</span>
      </Link>
      <span className="tag tag-accent px-[7px] py-px text-[9.5px]">admin</span>
      <Link
        href="/admin/waitlist"
        aria-current={pathname === '/admin/waitlist' ? 'page' : undefined}
      >
        Waitlist
      </Link>
      <Link
        href="/admin/compose"
        aria-current={pathname === '/admin/compose' ? 'page' : undefined}
      >
        Compose
      </Link>
      <span className="mono ml-auto text-[11px] text-neutral-600">{email}</span>
    </nav>
  );
}
