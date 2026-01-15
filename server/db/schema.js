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
  envVars: text('env_vars').notNull().default('[]'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at')
});

export const locations = sqliteTable('locations', {
  id: integer('id').primaryKey(),
  shortCode: text('short_code').notNull(),
  description: text('description').notNull().default('')
});

export const locationNodes = sqliteTable('location_nodes', {
  id: integer('id').primaryKey(),
  locationId: integer('location_id').notNull(),
  name: text('name').notNull(),
  fqdn: text('fqdn').notNull(),
  description: text('description').notNull().default('')
});

export const servers = sqliteTable('servers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  pteroServerId: integer('ptero_server_id').notNull().unique(),
  pteroUuid: text('ptero_uuid').notNull().unique(),
  pteroIdentifier: text('ptero_identifier').notNull().unique(),
  externalId: text('external_id'),
  pteroUserId: integer('ptero_user_id'),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  status: text('status'),
  suspended: integer('suspended', { mode: 'boolean' }).notNull().default(false),
  locationId: integer('location_id'),
  nodeId: integer('node_id'),
  allocationId: integer('allocation_id'),
  nestId: integer('nest_id'),
  eggId: integer('egg_id'),
  limitMemory: integer('limit_memory').notNull().default(0),
  limitSwap: integer('limit_swap').notNull().default(0),
  limitDisk: integer('limit_disk').notNull().default(0),
  limitIo: integer('limit_io').notNull().default(0),
  limitCpu: integer('limit_cpu').notNull().default(0),
  limitThreads: text('limit_threads'),
  oomDisabled: integer('oom_disabled', { mode: 'boolean' }).notNull().default(false),
  featureDatabases: integer('feature_databases').notNull().default(0),
  featureAllocations: integer('feature_allocations').notNull().default(0),
  featureBackups: integer('feature_backups').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

