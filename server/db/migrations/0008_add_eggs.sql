CREATE TABLE `eggs` (
	`id` integer PRIMARY KEY NOT NULL,
	`nest_id` integer NOT NULL,
	`uuid` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL DEFAULT '',
	`docker_image` text,
	`startup` text,
	`author` text,
	`created_at` text,
	`updated_at` text
);
