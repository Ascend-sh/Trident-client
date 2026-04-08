PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`amount` real NOT NULL,
	`fee` real DEFAULT 0 NOT NULL,
	`credits` real NOT NULL,
	`local_amount` text,
	`local_currency` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`provider` text DEFAULT 'paypal' NOT NULL,
	`provider_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_payments`("id", "user_id", "amount", "fee", "credits", "local_amount", "local_currency", "status", "provider", "provider_id", "created_at", "updated_at") SELECT "id", "user_id", "amount", "fee", "credits", "local_amount", "local_currency", "status", "provider", "provider_id", "created_at", "updated_at" FROM `payments`;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
ALTER TABLE `__new_payments` RENAME TO `payments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_wallets` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_wallets`("user_id", "balance", "updated_at") SELECT "user_id", "balance", "updated_at" FROM `wallets`;--> statement-breakpoint
DROP TABLE `wallets`;--> statement-breakpoint
ALTER TABLE `__new_wallets` RENAME TO `wallets`;