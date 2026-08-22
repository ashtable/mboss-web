import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

/**
 * This app renders the broadcast preview live in
 * the browser, so what it may import from
 * `@mboss/core` is narrower than what the private
 * services may. The email subpath imports nothing
 * at all and is shared with the worker that sends
 * the mail. The barrel drags in a graph-layout
 * engine and a TypeScript compiler wrapper, and
 * the signed-links subpath reaches `node:crypto`
 * — which this app has no use for either way,
 * since it holds no key ring and passes every
 * manage token through to the private API
 * untouched. `test/lint-rules.test.ts` proves the
 * rule actually fires.
 */
const emailSubpathOnly =
  'mboss-web imports only the @mboss/core/email subpath. ' +
  'The barrel would pull elkjs and ts-morph into the ' +
  'bundle, and signed-links reaches node:crypto for a ' +
  'capability this app does not have.';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      '.next/**',
      // Nested submodules lint in their own repos.
      'mboss-zod/**',
      'mboss-core/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Hook-order bugs are silent at runtime and
  // invisible to tsc, which is what earns the
  // extra plugin.
  reactHooks.configs.flat.recommended,
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: '@mboss/core', message: emailSubpathOnly }],
          patterns: [
            {
              group: ['@mboss/core/*', '!@mboss/core/email'],
              message: emailSubpathOnly,
            },
          ],
        },
      ],
    },
  },
  prettier, // last — turns off rules that fight Prettier
);
