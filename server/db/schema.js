import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull()
});

export const serverDefaults = sqliteTable('server_defaults', {
  id: integer('id').primaryKey(),
  memory: integer('memory').notNull().default(1024),
  swap: integer('swap').notNull().default(0),
  disk: integer('disk').notNull().default(2048),
  cpu: integer('cpu').notNull().default(100),
  io: integer('io').notNull().default(0),
  databases: integer('databases').notNull().default(0),
  allocations: integer('allocations').notNull().default(0),
  backups: integer('backups').notNull().default(0)
});

export const economySettings = sqliteTable('economy_settings', {
  id: integer('id').primaryKey(),
  currencyName: text('currency_name').notNull().default('TQN')
});

export const wallets = sqliteTable('wallets', {
  userId: integer('user_id').primaryKey(),
  balance: integer('balance').notNull().default(0)
});

export const nests = sqliteTable('nests', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default('')
});

export const nestEggs = sqliteTable('nest_eggs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nestId: integer('nest_id').notNull(),
  eggId: integer('egg_id').notNull()
});

export const eggs = sqliteTable('eggs', {
  id: integer('id').primaryKey(),
  nestId: integer('nest_id').notNull(),
  uuid: text('uuid').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  dockerImage: text('docker_image'),
  startup: text('startup'),
  author: text('author'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at')
});

