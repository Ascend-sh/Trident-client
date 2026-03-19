CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`credits` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`provider` text DEFAULT 'paypal' NOT NULL,
	`provider_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
