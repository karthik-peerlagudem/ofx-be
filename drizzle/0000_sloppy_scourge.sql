CREATE TABLE `payer` (
	`payer_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`transfer_reason` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`quote_id` text PRIMARY KEY NOT NULL,
	`sell_currency` text NOT NULL,
	`buy_currency` text NOT NULL,
	`amount` real NOT NULL,
	`ofx_rate` real NOT NULL,
	`inverse_ofx_rate` real NOT NULL,
	`converted_amount` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recipient` (
	`recipient_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`account_number` text NOT NULL,
	`bank_code` text NOT NULL,
	`bank_name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transfers` (
	`transfer_id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`payer_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`status` text DEFAULT 'Created' NOT NULL,
	`estimated_delivery_date` text NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`quote_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payer_id`) REFERENCES `payer`(`payer_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipient_id`) REFERENCES `recipient`(`recipient_id`) ON UPDATE no action ON DELETE no action
);
