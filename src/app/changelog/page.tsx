import { GitHubLink, SiteNav } from '@/components/site-nav';

/**
 * The same placeholder shape as the docs page. The
 * waitlist emails are the real changelog for now,
 * and this says so rather than showing an empty
 * list.
 */
export default function ChangelogPage() {
  return (
    <>
      <SiteNav>
        <GitHubLink />
      </SiteNav>
      <main className="px-6 py-10 md:px-10">
        <h1 className="text-[32px]">Changelog</h1>
        <p className="max-w-[560px] text-[14px]/[1.6] text-neutral-700">
          Progress goes out to the waitlist as it lands, and the commits are
          public in the meantime. A real changelog starts the day there is
          something to install.
        </p>
        <p>
          <a href="https://github.com/ashtable/mboss/commits">
            github.com/ashtable/mboss
          </a>
        </p>
      </main>
    </>
  );
}
