import { describe, expect, it } from 'vitest';

import { renderMarkdown } from '@mboss/core/email';
import { SubscriberStatusSchema } from '@mboss/zod';

/**
 * The nested submodules are consumed as raw
 * TypeScript through path aliases, so the aliases
 * themselves get a test: a broken alias otherwise
 * surfaces as a confusing resolution error deep
 * inside an unrelated suite.
 */
describe('nested submodule aliases', () => {
  it('resolves @mboss/zod', () => {
    expect(SubscriberStatusSchema.options).toEqual([
      'subscribed',
      'paused',
      'unsubscribed',
      'bounced',
    ]);
  });

  it('resolves the @mboss/core/email subpath', () => {
    expect(renderMarkdown('# The canvas is alive.')).toContain('font:600 22px');
  });
});
