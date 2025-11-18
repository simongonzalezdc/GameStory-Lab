import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

let dbInstance: BetterSQLite3Database<typeof schema> | null = null;

function initializeDb() {
  if (!dbInstance) {
    const sqlite = new Database(process.env.DATABASE_URL || 'local.db');
    sqlite.pragma('journal_mode = WAL'); // Enable Write-Ahead Logging for better concurrency
    dbInstance = drizzle(sqlite, { schema });
  }
  return dbInstance;
}

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(target, prop) {
    const instance = initializeDb();
    return instance[prop as keyof typeof instance];
  },
});
