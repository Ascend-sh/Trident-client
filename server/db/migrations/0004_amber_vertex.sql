CREATE TABLE `server_defaults` (
	`id` integer PRIMARY KEY NOT NULL,
	`memory` integer NOT NULL DEFAULT 1024,
	`swap` integer NOT NULL DEFAULT 0,
	`disk` integer NOT NULL DEFAULT 2048,
	`cpu` integer NOT NULL DEFAULT 100
);
--> statement-breakpoint
INSERT INTO `server_defaults` (`id`) VALUES (1);
