import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@zakaria/shared-contracts': path.resolve(rootDir, 'libs/shared/contracts/src/index.ts'),
      '@zakaria/backend-config': path.resolve(rootDir, 'libs/backend/config/src/index.ts'),
      '@zakaria/backend-database': path.resolve(rootDir, 'libs/backend/database/src/index.ts'),
      '@': path.resolve(rootDir, 'apps/web/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'apps/api/test/**/*.spec.ts',
      'apps/worker/test/**/*.spec.ts',
      'apps/web/test/**/*.spec.ts',
    ],
    exclude: ['e2e/**', '**/node_modules/**', '**/dist/**', '**/.next/**'],
  },
});
