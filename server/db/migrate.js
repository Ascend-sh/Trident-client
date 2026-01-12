import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db } from './client.js';

migrate(db, { migrationsFolder: './server/db/migrations' });

console.log('Migrations complete');
