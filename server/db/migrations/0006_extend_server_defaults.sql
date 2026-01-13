ALTER TABLE `server_defaults` ADD COLUMN `io` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `server_defaults` ADD COLUMN `databases` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `server_defaults` ADD COLUMN `allocations` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `server_defaults` ADD COLUMN `backups` integer NOT NULL DEFAULT 0;
