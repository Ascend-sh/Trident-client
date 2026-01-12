import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/db/schema.js',
  out: './server/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TORQEN_DB_PATH ?? './server/db/data/torqen.sqlite'
  }
});
