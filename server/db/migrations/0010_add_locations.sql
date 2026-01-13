CREATE TABLE `locations` (
	`id` integer PRIMARY KEY NOT NULL,
	`short_code` text NOT NULL,
	`description` text NOT NULL DEFAULT ''
);

CREATE TABLE `location_nodes` (
	`id` integer PRIMARY KEY NOT NULL,
	`location_id` integer NOT NULL,
	`name` text NOT NULL,
	`fqdn` text NOT NULL,
	`description` text NOT NULL DEFAULT ''
);

CREATE INDEX `location_nodes_location_id_idx` ON `location_nodes` (`location_id`);
CREATE UNIQUE INDEX `location_nodes_fqdn_unique` ON `location_nodes` (`fqdn`);
