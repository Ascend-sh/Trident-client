PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customization` (
	`id` integer PRIMARY KEY NOT NULL,
	`site_name` text DEFAULT 'Torqen Cloud' NOT NULL,
	`logo_url` text DEFAULT '/Logo-dark.png' NOT NULL,
	`brand_color` text DEFAULT '#18181b' NOT NULL,
	`brand_color_dark` text DEFAULT '#ffffff' NOT NULL,
	`brand_hover` text DEFAULT '#27272a' NOT NULL,
	`brand_hover_dark` text DEFAULT '#f4f4f5' NOT NULL,
	`surface` text DEFAULT '#ffffff' NOT NULL,
	`surface_dark` text DEFAULT '#121212' NOT NULL,
	`surface_light` text DEFAULT '#f4f4f5' NOT NULL,
	`surface_light_dark` text DEFAULT '#18181b' NOT NULL,
	`surface_highlight` text DEFAULT '#e5e5e5' NOT NULL,
	`surface_highlight_dark` text DEFAULT '#27272a' NOT NULL,
	`surface_lighter` text DEFAULT '#e4e4e7' NOT NULL,
	`surface_lighter_dark` text DEFAULT '#3f3f46' NOT NULL,
	`muted_foreground` text DEFAULT '#71717a' NOT NULL,
	`muted_foreground_dark` text DEFAULT '#a1a1aa' NOT NULL,
	`border_color` text DEFAULT '#e4e4e7' NOT NULL,
	`border_color_dark` text DEFAULT '#3f3f46' NOT NULL,
	`border_radius` text DEFAULT '0.625rem' NOT NULL,
	`font_family` text DEFAULT '''Satoshi'', sans-serif' NOT NULL,
	`is_compact` integer DEFAULT true NOT NULL,
	`is_dark` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_customization`("id", "site_name", "logo_url", "brand_color", "brand_color_dark", "brand_hover", "brand_hover_dark", "surface", "surface_dark", "surface_light", "surface_light_dark", "surface_highlight", "surface_highlight_dark", "surface_lighter", "surface_lighter_dark", "muted_foreground", "muted_foreground_dark", "border_color", "border_color_dark", "border_radius", "font_family", "is_compact", "is_dark", "updated_at") SELECT "id", "site_name", "logo_url", "brand_color", "brand_color_dark", "brand_hover", "brand_hover_dark", "surface", "surface_dark", "surface_light", "surface_light_dark", "surface_highlight", "surface_highlight_dark", "surface_lighter", "surface_lighter_dark", "muted_foreground", "muted_foreground_dark", "border_color", "border_color_dark", "border_radius", "font_family", "is_compact", "is_dark", "updated_at" FROM `customization`;--> statement-breakpoint
DROP TABLE `customization`;--> statement-breakpoint
ALTER TABLE `__new_customization` RENAME TO `customization`;--> statement-breakpoint
PRAGMA foreign_keys=ON;