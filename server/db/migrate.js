import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { Database } from 'bun:sqlite';
import { db } from './client.js';

function ensureEggEnvVarsColumn() {
  const dbPath = process.env.TORQEN_DB_PATH ?? './server/db/data/torqen.sqlite';
  const sqlite = new Database(dbPath);
  const cols = sqlite.query("PRAGMA table_info(eggs)").all();
  const has = Array.isArray(cols) && cols.some(c => c?.name === 'env_vars');
  if (!has) {
    sqlite.run("ALTER TABLE `eggs` ADD COLUMN `env_vars` text NOT NULL DEFAULT '[]';");
  }
  sqlite.close();
}

migrate(db, { migrationsFolder: './server/db/migrations' });
ensureEggEnvVarsColumn();

console.log('Migrations complete');
