import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const dbPath = process.env.TRIDENT_DB_PATH ?? './server/db/data/trident.sqlite';

mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);

export const db = drizzle(sqlite);
