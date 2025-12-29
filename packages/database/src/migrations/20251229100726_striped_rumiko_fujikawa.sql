CREATE TABLE `admin` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`email` text NOT NULL,
	`email_confirmed_at` integer,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`name` text NOT NULL,
	`hashed_password` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_email_unique` ON `admin` (`email`);--> statement-breakpoint
CREATE TABLE `admin_otp` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`type` text DEFAULT 'LOGIN' NOT NULL,
	`identifier` text,
	`admin_id` text,
	`code` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`revoked_reason` text,
	FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `unit` (
	`id` text PRIMARY KEY NOT NULL,
	`block` text NOT NULL,
	`floor` text NOT NULL,
	`number` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unit_block_floor_number_unique` ON `unit` (`block`,`floor`,`number`);--> statement-breakpoint
CREATE TABLE `unit_otp` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`type` text DEFAULT 'VEHICLE_MANAGEMENT' NOT NULL,
	`unit_id` text,
	`code` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`revoked_reason` text,
	FOREIGN KEY (`unit_id`) REFERENCES `unit`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vehicle` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`unit_id` text NOT NULL,
	`number_plate` text NOT NULL,
	`model` text,
	`color` text,
	FOREIGN KEY (`unit_id`) REFERENCES `unit`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_vehicle_created_at` ON `vehicle` (`unit_id`);--> statement-breakpoint
CREATE INDEX `idx_vehicle_unit_id` ON `vehicle` (`unit_id`);