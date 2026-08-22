import { fileURLToPath } from 'node:url';

/**
 * Vitest resolves neither tsconfig `paths` nor a package `main` field, so the
 * aliases are restated here. Keep in lockstep with tsconfig.json's `paths`.
 *
 * `@mboss/core/signed-links` is deliberately absent: this app holds no key
 * ring, never mints and never verifies a link, and the signer reaches
 * `node:crypto`, which has no business in a browser bundle.
 */
export const aliases = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
  '@mboss/zod': fileURLToPath(
    new URL('./mboss-zod/src/index.ts', import.meta.url),
  ),
  '@mboss/core/email': fileURLToPath(
    new URL('./mboss-core/src/email/index.ts', import.meta.url),
  ),
};
