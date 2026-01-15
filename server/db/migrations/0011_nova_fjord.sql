CREATE TABLE IF NOT EXISTS `location_nodes` (
	`id` integer PRIMARY KEY NOT NULL,
	`location_id` integer NOT NULL,
	`name` text NOT NULL,
	`fqdn` text NOT NULL,
	`description` text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS `location_nodes_location_id_idx` ON `location_nodes` (`location_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `location_nodes_fqdn_unique` ON `location_nodes` (`fqdn`);
