CREATE TABLE `economy_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`currency_name` text NOT NULL DEFAULT 'TQN'
);
--> statement-breakpoint
INSERT INTO `economy_settings` (`id`) VALUES (1);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`balance` integer NOT NULL DEFAULT 0
);
