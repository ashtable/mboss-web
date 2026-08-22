import Link from 'next/link';

/**
 * The site chrome, shared by every public page. The
 * brand is a link home; whatever belongs at the far
 * edge — the repo link, a subscriber's own address,
 * the signed-in admin — is passed in and placed
 * there by the caller with `ml-auto`, because each
 * screen puts something different there.
 */
export function SiteNav({ children }: { children?: React.ReactNode }) {
  return (
    <nav className="nav border-b border-divider bg-white">
      <Link href="/" className="inline-flex items-center gap-2">
        <span
          aria-hidden
          className="grid h-[19px] w-[19px] place-items-center bg-accent font-heading text-[11px] font-semibold text-white"
        >
          m
        </span>
        <span className="nav-brand">mBoss</span>
      </Link>
      {children}
    </nav>
  );
}

/**
 * The repo link the landing page ends its nav with.
 * The glyph is the design's own three-node mark
 * rather than a vendor logo — the same shape the
 * canvas draws workflows with.
 */
export function GitHubLink() {
  return (
    <a
      href="https://github.com/ashtable/mboss"
      className="tag ml-auto inline-flex items-center gap-[6px] border border-divider px-[11px] py-1 text-[12.5px] text-text"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <circle cx="4" cy="3.5" r="1.8" />
        <circle cx="4" cy="10.5" r="1.8" />
        <circle cx="10.5" cy="7" r="1.8" />
        <path d="M4 5.3v3.4M5.6 4.2l3.2 2M5.6 9.8l3.2-2" />
      </svg>
      github.com/ashtable/mboss
    </a>
  );
}
