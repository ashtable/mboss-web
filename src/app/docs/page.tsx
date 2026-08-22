import { GitHubLink, SiteNav } from '@/components/site-nav';

/**
 * A placeholder with a destination, so the nav link
 * and the confirmation email's `mboss.dev/docs`
 * both land somewhere true rather than on a 404.
 */
export default function DocsPage() {
  return (
    <>
      <SiteNav>
        <GitHubLink />
      </SiteNav>
      <main className="px-6 py-10 md:px-10">
        <h1 className="text-[32px]">Docs</h1>
        <p className="max-w-[560px] text-[14px]/[1.6] text-neutral-700">
          There is nothing to install yet, so there is nothing to document yet.
          Until there is, the repository is the honest version of this page —
          the design notes, the schema and the workflows are all in it.
        </p>
        <p>
          <a href="https://github.com/ashtable/mboss">
            github.com/ashtable/mboss
          </a>
        </p>
      </main>
    </>
  );
}
