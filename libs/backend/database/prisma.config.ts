import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fallbackDatabaseUrl =
  'postgresql://postgres:postgres@127.0.0.1:5432/zakaria2_next_dev?schema=public';

export default defineConfig({
  schema: path.join(currentDir, 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join(currentDir, 'prisma', 'migrations'),
  },
  datasource: {
    url: process.env.DATABASE_URL?.trim() || fallbackDatabaseUrl,
  },
});

