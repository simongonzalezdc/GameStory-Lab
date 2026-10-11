/**
 * Prisma Client Export
 * Centralized Prisma instance
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma 7 requires a driver adapter at runtime; the connection URL lives in
 * prisma.config.ts at the repo root, not in schema.prisma.
 */
const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : undefined;

export const prisma = new PrismaClient(adapter ? { adapter } : {});
