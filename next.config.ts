import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * `mboss-zod` and `mboss-core` are nested as raw
   * TypeScript and, like every other repo here,
   * import their own siblings with a `.js`
   * extension. Turbopack does not substitute `.ts`
   * for that extension, so both `dev` and `build`
   * run on webpack, which does — see the `--webpack`
   * flag on those scripts. Vitest resolves the
   * submodules through its own aliases and never
   * sees this, so only a real build catches it.
   */
  experimental: {
    extensionAlias: { '.js': ['.ts', '.tsx', '.js'] },
  },

  // The generated agent instructions describe
  // Next.js itself rather than this app, and the
  // repo already carries the conventions worth
  // writing down.
  agentRules: false,
};

export default nextConfig;
