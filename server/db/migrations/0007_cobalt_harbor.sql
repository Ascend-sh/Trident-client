CREATE TABLE `nests` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nest_eggs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nest_id` integer NOT NULL,
	`egg_id` integer NOT NULL
);
