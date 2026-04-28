CREATE TABLE `autosave_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`praktikan_id` text NOT NULL,
	`modul_id` text NOT NULL,
	`tipe_soal` text NOT NULL,
	`jawaban` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `autosave_snapshots_praktikan_modul_tipe_unique` ON `autosave_snapshots` (`praktikan_id`,`modul_id`,`tipe_soal`);
--> statement-breakpoint
CREATE TABLE `autosave_question_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`praktikan_id` text NOT NULL,
	`modul_id` text NOT NULL,
	`tipe_soal` text NOT NULL,
	`question_ids` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `autosave_question_snapshots_praktikan_modul_tipe_unique` ON `autosave_question_snapshots` (`praktikan_id`,`modul_id`,`tipe_soal`);
