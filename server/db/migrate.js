import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { Database } from 'bun:sqlite';
import { db } from './client.js';

function ensureSchemaConsistency() {
  const dbPath = process.env.TORQEN_DB_PATH ?? './server/db/data/torqen.sqlite';
  const sqlite = new Database(dbPath);
  
  // Ensure eggs.env_vars
  const eggCols = sqlite.query("PRAGMA table_info(eggs)").all();
  if (!eggCols.some(c => c?.name === 'env_vars')) {
    sqlite.run("ALTER TABLE `eggs` ADD COLUMN `env_vars` text NOT NULL DEFAULT '[]';");
  }

  // Ensure server_defaults.slots
  const defaultCols = sqlite.query("PRAGMA table_info(server_defaults)").all();
  if (!defaultCols.some(c => c?.name === 'slots')) {
    sqlite.run("ALTER TABLE `server_defaults` ADD COLUMN `slots` integer NOT NULL DEFAULT 1;");
  }
  
  sqlite.close();
}

function applyManualMigrations() {
  const dbPath = process.env.TORQEN_DB_PATH ?? './server/db/data/torqen.sqlite';
  const sqlite = new Database(dbPath);
  
  try {
    // Manually add slots if missing
    const defaultCols = sqlite.query("PRAGMA table_info(server_defaults)").all();
    if (!defaultCols.some(c => c?.name === 'slots')) {
      sqlite.run("ALTER TABLE `server_defaults` ADD COLUMN `slots` integer NOT NULL DEFAULT 1;");
      console.log("Applied manual migration: add slots to server_defaults");
    }
  } catch (err) {
    console.error("Manual migration error:", err.message);
  } finally {
    sqlite.close();
  }
}

try {
  // Try standard migrate first, but don't crash if it fails due to journal issues
  migrate(db, { migrationsFolder: './server/db/migrations' });
} catch (err) {
  console.warn("Standard migration skipped or failed:", err.message);
}

applyManualMigrations();
ensureSchemaConsistency();

console.log('Migrations phase complete');
