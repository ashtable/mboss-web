import { defineConfig } from 'vitest/config';
import { aliases } from './vitest.aliases.js';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
  },
  resolve: { alias: aliases },
});
