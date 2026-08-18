'use client';

import { renderBroadcastEmail } from '@mboss/core/email';

/**
 * The broadcast as it will arrive, rendered by the
 * same module the worker sends with. There is
 * nothing here that could drift from the real email,
 * because there is no second implementation to drift
 * from — @mboss/core/email imports nothing at all,
 * which is what lets it run in a browser as the
 * admin types.
 *
 * `links` is null: a preview has no subscriber
 * behind it and so no token that could ever verify.
 * The renderer draws the unsubscribe line as plain
 * text in that case, and the caption says why.
 *
 * It goes in a sandboxed iframe rather than the page:
 * the email carries its own document and its own
 * inline styles, which have no business in the
 * console's cascade, and admin-written Markdown
 * rendered into this document would be a self-XSS the
 * sandbox removes for free.
 */
export function EmailPreview({
  to,
  subject,
  bodyMarkdown,
  teaserImageUrl,
}: {
  to: string;
  subject: string;
  bodyMarkdown: string;
  teaserImageUrl: string | null;
}) {
  const { html } = renderBroadcastEmail({
    to,
    subject,
    bodyMarkdown,
    teaserImageUrl,
    links: null,
  });

  return (
    <div>
      <div className="border border-divider bg-neutral-100 p-[14px]">
        <div className="h-[340px] overflow-hidden">
          <iframe
            title="Email preview"
            sandbox=""
            srcDoc={html}
            className="h-[583px] w-[500px] origin-top-left scale-[0.72] border-0"
          />
        </div>
        <div className="mono mt-2 text-center text-[8.5px] text-neutral-500">
          sent via sendgrid · manage &amp; unsubscribe links added automatically
        </div>
      </div>
      <p className="mt-2 text-[10px] text-neutral-600">
        Lands in the inbox looking like this.
      </p>
    </div>
  );
}
