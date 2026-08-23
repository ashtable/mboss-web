import Link from 'next/link';

import { Blueprint } from '@/components/blueprint';
import { GitHubLink, SiteNav } from '@/components/site-nav';

import { JoinBox } from './join-box';

/**
 * The landing page. Everything here except the join
 * box is static, so the page renders on the server
 * and ships one small island of interactivity.
 *
 * There is no pricing, no testimonial and no
 * comparison table, and that is the point: the
 * product does not exist yet, and the page says so
 * in its own words rather than promising a launch.
 */

const AGENTS = [
  'codex cli',
  'claude code · acp ▾',
  'gloo code',
  'any acp agent',
];

export default function LandingPage() {
  return (
    <>
      <SiteNav>
        <Link href="/docs">Docs</Link>
        <Link href="/changelog">Changelog</Link>
        <GitHubLink />
      </SiteNav>

      <main>
        <section className="flex flex-col gap-[30px] px-6 pt-[34px] pb-[38px] md:flex-row md:px-10">
          <div className="md:flex-[1.15]">
            <div className="eyebrow text-accent-700">
              AGENT-NATIVE · VS CODE + DBOS
            </div>
            <h1 className="mt-2 text-[40px]/[1.02]">Design durable apps.</h1>
            <p className="mt-[10px] max-w-[400px] text-[14px]/[1.6] text-neutral-700">
              Describe it in plain language or draw it on the canvas — your
              coding agent proposes the workflow, mBoss validates and previews
              it, and the approved graph compiles to durable DBOS code.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-[6px]">
              <span className="eyebrow text-[9.5px]">BRING YOUR AGENT</span>
              {AGENTS.map((agent) => (
                <span
                  key={agent}
                  className="tag tag-outline px-[7px] py-px text-[9.5px]"
                >
                  {agent}
                </span>
              ))}
            </div>
            <JoinBox />
          </div>

          <div
            aria-hidden
            className="canvas-grid flex flex-col items-start justify-center border border-divider px-5 py-4 md:flex-1 md:pl-[34px]"
          >
            <CanvasNode
              icon={<BoltIcon />}
              title="Request created"
              meta="on: helper.request.created"
            />
            <CanvasArrow label="Request" />
            <CanvasNode
              icon={<ClockIcon />}
              title="Wait for the form"
              meta="durable wait — sleeps in Postgres"
            />
            <CanvasArrow label="Submission" />
            <CanvasNode
              icon={<DatabaseIcon />}
              title="Embed into Weaviate"
              meta="auto-embed · durable step"
            />
          </div>
        </section>

        <section className="px-6 pb-[34px] md:px-10">
          <div className="eyebrow text-accent-700">
            SNEAK PEEKS — FROM THE DEVELOPMENT BUILD
          </div>
          <div className="mt-[10px] flex flex-col items-stretch gap-[14px] md:flex-row">
            <PeekPanel title="PROMPT IT — OR DRAW IT" caption="the canvas">
              <div className="canvas-grid flex flex-col items-start px-[14px] py-3 [background-size:14px_14px]">
                <div className="mono mb-2 border border-accent-300 bg-accent-100 px-[7px] py-[3px] text-[9px] text-accent-800">
                  &quot;book grooming with christa&quot; → 7 nodes · validated ✓
                  · approved
                </div>
                <CanvasNode
                  compact
                  icon={<BoltIcon />}
                  title="Booking request"
                  meta="on: booking.requested"
                />
                <CanvasArrow />
                <CanvasNode
                  compact
                  icon={<GlobeIcon />}
                  title="Find open slot"
                  meta="browser · stagehand → steel"
                />
                <CanvasArrow />
                <CanvasNode
                  compact
                  icon={<DatabaseIcon />}
                  title="Record booking"
                  meta="tx · exactly-once ✓"
                />
              </div>
            </PeekPanel>

            <PeekPanel title="WATCH IT SURVIVE A CRASH" caption="the runs view">
              <div className="mono p-[14px] text-[9.5px]/[2.1] text-neutral-600">
                <StepBar name="parse_request" width={26} />
                <StepBar name="find_slot" width={74} />
                <div className="flex items-center gap-2">
                  <span className="w-[92px]">book_appt</span>
                  <span className="h-[7px] w-[38px] bg-[oklch(52%_.09_30_/_.55)]" />
                  <span className="w-[52px] border-t-2 border-dotted border-neutral-400" />
                  <span className="h-[7px] w-[44px] bg-accent-600" />
                  <span className="whitespace-nowrap text-accent-700">
                    resumed ✓
                  </span>
                </div>
                <div className="mt-[6px] text-neutral-500">
                  process killed mid-run — DBOS picked up
                  <br />
                  from Postgres · 0 steps re-executed
                </div>
              </div>
            </PeekPanel>

            <PeekPanel
              title="SHIP REAL DBOS CODE"
              caption="generated · read-only"
            >
              <div className="mono p-[14px] text-[10px]/[1.9]">
                <div className="text-accent-2-700">@DBOS.transaction()</div>
                <div>
                  <span className="text-accent-700">async function</span>{' '}
                  <span>recordBooking</span>
                  <span className="text-neutral-600">(hold) {'{'}</span>
                </div>
                <div className="text-neutral-600">
                  &nbsp;&nbsp;// committed with workflow progress —
                </div>
                <div className="text-neutral-600">
                  &nbsp;&nbsp;// exactly-once, no dedupe tables
                </div>
                <div className="text-neutral-600">{'}'}</div>
                <div className="mt-[5px]">
                  <span className="bg-accent-100 px-[7px] py-[2px] text-[9.5px] font-medium text-accent-800">
                    exactly-once ✓
                  </span>
                </div>
              </div>
            </PeekPanel>
          </div>

          <div className="mono mt-2 text-[10px] text-neutral-500">
            early development screens — details will change · follow along at
            github.com/ashtable/mboss
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-3 border-t border-divider px-6 py-[18px] md:flex-row md:items-center md:justify-between md:px-10">
        <div>
          <div className="font-heading text-[15px] font-semibold text-text">
            mBoss
          </div>
          <p className="mono mt-1 text-[10.5px] text-neutral-600">
            Design durable apps with DBOS.
          </p>
          <p className="mono mt-2 text-[10px] text-neutral-500">
            © 2026 mBoss · hello@mboss.dev
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex items-center gap-4 text-[12.5px]"
        >
          <FooterLink href="/docs">Docs</FooterLink>
          <FooterLink href="/changelog">Changelog</FooterLink>
          <FooterLink href="/admin">Admin</FooterLink>
        </nav>
      </footer>
    </>
  );
}

/**
 * The footer's own three links, not the header nav's
 * Docs/Changelog: same destinations, but this is the
 * quiet copy — Admin sits beside them, discoverable
 * rather than called out, so the door is findable
 * without being a headline.
 */
function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-neutral-600 no-underline hover:text-accent-700"
    >
      {children}
    </Link>
  );
}

function PeekPanel({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <Blueprint className="flex-1 bg-white">
      <div className="flex items-baseline gap-2 border-b border-divider px-3 py-2">
        <span className="font-heading text-[11px] font-semibold tracking-[0.07em] text-neutral-600">
          {title}
        </span>
        <span className="mono ml-auto text-[9px] text-neutral-400">
          {caption}
        </span>
      </div>
      <div className="min-h-[150px]">{children}</div>
    </Blueprint>
  );
}

function CanvasNode({
  icon,
  title,
  meta,
  compact = false,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`elev-sm flex items-center gap-[9px] border border-divider bg-white ${
        compact ? 'w-[210px] px-[9px] py-[5px]' : 'w-[250px] px-[11px] py-[7px]'
      }`}
    >
      <span className="mono grid h-[22px] w-[22px] flex-none place-items-center border border-divider text-accent-700">
        {icon}
      </span>
      <span>
        <b className="block font-heading text-[12.5px] font-semibold">
          {title}
        </b>
        <span className="mono block text-[9px] text-neutral-600">{meta}</span>
      </span>
    </div>
  );
}

function CanvasArrow({ label }: { label?: string }) {
  return (
    <span className="mono my-[2px] ml-4 text-[9.5px] text-neutral-400">
      ↓ {label !== undefined && <i className="text-neutral-500">{label}</i>}
    </span>
  );
}

function StepBar({ name, width }: { name: string; width: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[92px]">{name}</span>
      <span className="h-[7px] bg-accent-400" style={{ width }} />
    </div>
  );
}

function BoltIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M7.5 1L3 8h3.5l-1 5L11 6H7.5z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="7" cy="7" r="5.5" />
      <path d="M7 3.8V7l2.2 1.6" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="7" cy="7" r="5.5" />
      <ellipse cx="7" cy="7" rx="2.5" ry="5.5" />
      <path d="M1.5 7h11" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <ellipse cx="7" cy="3.2" rx="5" ry="2.1" />
      <path d="M2 3.2v7.4c0 1.2 2.2 2.1 5 2.1s5-.9 5-2.1V3.2" />
    </svg>
  );
}
