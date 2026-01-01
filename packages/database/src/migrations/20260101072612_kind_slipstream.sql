CREATE TABLE `lucky_draw` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lucky_draw_entry` (
	`lucky_draw_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text,
	`email` text,
	`phone_number` text,
	PRIMARY KEY(`lucky_draw_id`, `unit_id`),
	FOREIGN KEY (`lucky_draw_id`) REFERENCES `lucky_draw`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`unit_id`) REFERENCES `unit`(`id`) ON UPDATE cascade ON DELETE cascade
);
