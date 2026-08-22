import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The stylesheet is read as text rather than
 * through a browser: this proves the design's
 * values are written down correctly and exactly
 * once, which is what a dropped or duplicated
 * token looks like. Whether the custom properties
 * actually resolve on a rendered page is a
 * browser question, and the end-to-end suite asks
 * it there.
 */
const css = readFileSync(
  fileURLToPath(new URL('../src/app/globals.css', import.meta.url)),
  'utf8',
);

const tokens: Array<[name: string, value: string]> = [
  ['--color-bg', '#f2f2f3'],
  ['--color-surface', '#e9e9ea'],
  ['--color-text', '#1d1f20'],
  ['--color-accent', '#5980a6'],
  ['--color-accent-2', '#728fab'],
  ['--color-divider', 'color-mix(in srgb, #1d1f20 16%, transparent)'],
  ['--color-neutral-100', '#f5f5f8'],
  ['--color-neutral-200', '#e7e7ea'],
  ['--color-neutral-300', '#d4d4d7'],
  ['--color-neutral-400', '#b7b7ba'],
  ['--color-neutral-500', '#98989b'],
  ['--color-neutral-600', '#7a7a7d'],
  ['--color-neutral-700', '#5d5d60'],
  ['--color-neutral-800', '#424244'],
  ['--color-neutral-900', '#2b2b2d'],
  ['--color-accent-100', '#eef6ff'],
  ['--color-accent-200', '#d6ebff'],
  ['--color-accent-300', '#b5d9fd'],
  ['--color-accent-400', '#94bce3'],
  ['--color-accent-500', '#749dc4'],
  ['--color-accent-600', '#597ea3'],
  ['--color-accent-700', '#416180'],
  ['--color-accent-800', '#2c455d'],
  ['--color-accent-900', '#1d2d3d'],
  ['--color-accent-2-100', '#eef6ff'],
  ['--color-accent-2-200', '#d6ebff'],
  ['--color-accent-2-300', '#bdd8f2'],
  ['--color-accent-2-400', '#9ebbd8'],
  ['--color-accent-2-500', '#7e9cb8'],
  ['--color-accent-2-600', '#627d98'],
  ['--color-accent-2-700', '#486077'],
  ['--color-accent-2-800', '#314457'],
  ['--color-accent-2-900', '#1f2d3a'],
  ['--font-heading-weight', '600'],
  ['--space-1', '3.4px'],
  ['--space-2', '6.8px'],
  ['--space-3', '10.2px'],
  ['--space-4', '13.6px'],
  ['--space-6', '20.4px'],
  ['--space-8', '27.2px'],
  ['--radius-sm', '2px'],
  ['--radius-md', '4px'],
  ['--radius-lg', '7px'],
  ['--shadow-sm', '0 1px 2px color-mix(in srgb, #2b2b2d 14%, transparent)'],
  ['--shadow-md', '0 3px 10px color-mix(in srgb, #2b2b2d 16%, transparent)'],
  ['--shadow-lg', '0 12px 32px color-mix(in srgb, #2b2b2d 22%, transparent)'],
];

function declarationsOf(name: string): string[] {
  const pattern = new RegExp(`^\\s*${name}:\\s*(.+);$`, 'gm');
  return [...css.matchAll(pattern)].map((match) => match[1] ?? '');
}

describe('design tokens', () => {
  it.each(tokens)('declares %s exactly once, as %s', (name, value) => {
    expect(declarationsOf(name)).toEqual([value]);
  });

  /**
   * The font tokens name the loaded face first and
   * the design's stack behind it. next/font hashes
   * the family name it generates, so the literal
   * cannot be written down — but the fallback that
   * shows before the webfont arrives can, and it
   * is the design's.
   */
  it.each([
    ['--font-body', "'Barlow', system-ui, sans-serif"],
    ['--font-heading', "'Barlow Condensed', system-ui, sans-serif"],
  ])('declares %s falling back to %s', (name, stack) => {
    const [declaration, ...rest] = declarationsOf(name);
    expect(rest).toEqual([]);
    expect(declaration).toMatch(
      new RegExp(`^var\\(--font-[a-z-]+\\), ${stack}$`),
    );
  });

  it('carries no dark-mode block', () => {
    // Light-only is a product decision, and the way
    // it gets lost is someone pasting a starter
    // template.
    expect(css).not.toMatch(/prefers-color-scheme/);
    expect(css).not.toMatch(/\.dark\b/);
    expect(css).not.toMatch(/\[data-theme/);
  });

  it('squares off the components after the rules that round them', () => {
    // Order is the whole mechanism: the components
    // are written with the system's radii and then
    // overridden into wireframe objects, so a rule
    // moved above the override silently stops
    // applying.
    const rounded = css.lastIndexOf('border-radius: var(--radius-md)');
    const squared = css.lastIndexOf('border-radius: 0;');
    expect(rounded).toBeGreaterThan(-1);
    expect(squared).toBeGreaterThan(rounded);
  });
});
