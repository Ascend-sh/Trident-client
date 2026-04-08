ALTER TABLE `payments` ADD `fee` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `local_amount` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `local_currency` text;