import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Next.js phones home unless
 * NEXT_TELEMETRY_DISABLED is set, and the two
 * places that set it cover disjoint paths:
 * package.json covers `npm run …` locally and in
 * CI, the Dockerfile covers the container, whose
 * entrypoint execs the `next` binary directly and
 * so never sees a package.json prefix. Neither is
 * a backup for the other, so editing one and
 * forgetting the other is the regression this
 * guards.
 */
function read(name: string): string {
  return readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8');
}

/**
 * Scanned rather than listed, so a newly added
 * script that invokes `next` is covered the day
 * it lands. The lowercase word `next` cannot
 * match the uppercase variable name.
 */
function nextInvokingScripts(): [string, string][] {
  const { scripts } = JSON.parse(read('../package.json')) as {
    scripts: Record<string, string>;
  };
  return Object.entries(scripts).filter(([, command]) =>
    /(?:^|\s)next(?:\s|$)/.test(command),
  );
}

describe('package.json scripts', () => {
  it('finds the scripts that invoke next', () => {
    // Without this the scan could silently match
    // nothing and every assertion below would pass
    // vacuously.
    expect(nextInvokingScripts().length).toBeGreaterThan(0);
  });

  it.each(nextInvokingScripts())('disables telemetry in %s', (_, command) => {
    expect(command).toContain('NEXT_TELEMETRY_DISABLED=1');
  });
});

describe('Dockerfile', () => {
  it('disables telemetry before the first RUN', () => {
    // Position is semantic: ENV only applies to
    // the instructions below it, so one placed
    // after `RUN npm ci` would leave the install
    // uncovered.
    const lines = read('../Dockerfile').split('\n');
    const env = lines.findIndex((line) =>
      /^ENV\s+NEXT_TELEMETRY_DISABLED=1\s*$/.test(line),
    );
    const run = lines.findIndex((line) => line.startsWith('RUN'));

    expect(env).toBeGreaterThan(-1);
    expect(run).toBeGreaterThan(-1);
    expect(env).toBeLessThan(run);
  });
});
