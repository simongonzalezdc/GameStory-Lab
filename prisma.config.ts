import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 moved the datasource connection URL out of schema.prisma and
 * into this config file. The schema no longer declares `url`, and the
 * runtime client takes a driver adapter (see src/lib/prisma.ts).
 *
 * Loaded from the repo root by the `db:*` scripts — Prisma reads .env from
 * the working directory, so those run at root (see docs/operations.md).
 */
export default defineConfig({
  schema: 'packages/backend/prisma/schema.prisma',
  migrations: {
    path: 'packages/backend/prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
