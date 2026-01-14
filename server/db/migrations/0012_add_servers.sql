CREATE TABLE IF NOT EXISTS `servers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`ptero_server_id` integer NOT NULL,
	`ptero_uuid` text NOT NULL,
	`ptero_identifier` text NOT NULL,
	`external_id` text,
	`ptero_user_id` integer,
	`name` text NOT NULL,
	`description` text NOT NULL DEFAULT '',
	`status` text,
	`suspended` integer NOT NULL DEFAULT 0,
	`location_id` integer,
	`node_id` integer,
	`allocation_id` integer,
	`nest_id` integer,
	`egg_id` integer,
	`limit_memory` integer NOT NULL DEFAULT 0,
	`limit_swap` integer NOT NULL DEFAULT 0,
	`limit_disk` integer NOT NULL DEFAULT 0,
	`limit_io` integer NOT NULL DEFAULT 0,
	`limit_cpu` integer NOT NULL DEFAULT 0,
	`limit_threads` text,
	`oom_disabled` integer NOT NULL DEFAULT 0,
	`feature_databases` integer NOT NULL DEFAULT 0,
	`feature_allocations` integer NOT NULL DEFAULT 0,
	`feature_backups` integer NOT NULL DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `servers_ptero_server_id_unique` ON `servers` (`ptero_server_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `servers_ptero_uuid_unique` ON `servers` (`ptero_uuid`);
CREATE UNIQUE INDEX IF NOT EXISTS `servers_ptero_identifier_unique` ON `servers` (`ptero_identifier`);
CREATE INDEX IF NOT EXISTS `servers_user_id_idx` ON `servers` (`user_id`);
