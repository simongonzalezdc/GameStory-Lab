/**
 * Narrowing helpers for Prisma JSON values.
 * AI-generated and database-stored JSON arrives as JsonValue; these guards
 * turn it into honestly-typed records without `any` casts.
 */
import type { Prisma } from '@prisma/client';

export type JsonRecord = Record<string, Prisma.JsonValue | undefined>;

export function isJsonRecord(value: Prisma.JsonValue | null | undefined): value is JsonRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
