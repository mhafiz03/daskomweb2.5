CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`asisten_id` text,
	`action` text NOT NULL,
	`route` text,
	`method` text(16) NOT NULL,
	`description` text,
	`metadata` text,
	`ip_address` text(45),
	`user_agent` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`asisten_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `configurations` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`type` text,
	`tp_schedule_enabled` integer DEFAULT false,
	`tp_schedule_start_at` integer,
	`tp_schedule_end_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `configurations_key_unique` ON `configurations` (`key`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`asisten_id` text NOT NULL,
	`praktikan_id` text NOT NULL,
	`kelas_id` text NOT NULL,
	`pesan` text NOT NULL,
	`read` integer DEFAULT false,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`asisten_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `foto_asistens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`foto_url` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `jadwal_jagas` (
	`id` text PRIMARY KEY NOT NULL,
	`kelas_id` text NOT NULL,
	`asisten_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asisten_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `jawaban_fitbs` (
	`id` text PRIMARY KEY NOT NULL,
	`praktikan_id` text NOT NULL,
	`soal_id` text NOT NULL,
	`modul_id` text NOT NULL,
	`jawaban` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`soal_id`) REFERENCES `soal_fitbs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `jawaban_jurnals` (
	`id` text PRIMARY KEY NOT NULL,
	`praktikan_id` text NOT NULL,
	`soal_id` text NOT NULL,
	`modul_id` text NOT NULL,
	`jawaban` text NOT NULL,
	`file_url` text,
	`file_name` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`soal_id`) REFERENCES `soal_jurnals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `jawaban_mandiris` (
	`id` text PRIMARY KEY NOT NULL,
	`praktikan_id` text NOT NULL,
	`soal_id` text NOT NULL,
	`modul_id` text NOT NULL,
	`jawaban` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`soal_id`) REFERENCES `soal_mandiris`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `jawaban_tas` (
	`id` text PRIMARY KEY NOT NULL,
	`praktikan_id` text NOT NULL,
	`soal_id` text NOT NULL,
	`modul_id` text NOT NULL,
	`opsi_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`soal_id`) REFERENCES `soal_tas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`opsi_id`) REFERENCES `soal_opsis`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jawaban_tas_soal_praktikan_unique` ON `jawaban_tas` (`soal_id`,`praktikan_id`);--> statement-breakpoint
CREATE TABLE `jawaban_tks` (
	`id` text PRIMARY KEY NOT NULL,
	`praktikan_id` text NOT NULL,
	`soal_id` text NOT NULL,
	`modul_id` text NOT NULL,
	`opsi_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`soal_id`) REFERENCES `soal_tks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`opsi_id`) REFERENCES `soal_opsis`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jawaban_tks_soal_praktikan_unique` ON `jawaban_tks` (`soal_id`,`praktikan_id`);--> statement-breakpoint
CREATE TABLE `jawaban_tps` (
	`id` text PRIMARY KEY NOT NULL,
	`praktikan_id` text NOT NULL,
	`soal_id` text NOT NULL,
	`modul_id` text NOT NULL,
	`jawaban` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`soal_id`) REFERENCES `soal_tps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `jenis_pollings` (
	`id` text PRIMARY KEY NOT NULL,
	`judul` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kelas` (
	`id` text PRIMARY KEY NOT NULL,
	`kelas` text(10) NOT NULL,
	`hari` text NOT NULL,
	`shift` integer NOT NULL,
	`is_english` integer DEFAULT false NOT NULL,
	`total_group` integer,
	`is_tot` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kumpul_tps` (
	`id` text PRIMARY KEY NOT NULL,
	`modul_id` text NOT NULL,
	`kelas_id` text NOT NULL,
	`praktikan_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `laporan_praktikans` (
	`id` text PRIMARY KEY NOT NULL,
	`praktikan_id` text NOT NULL,
	`asisten_id` text,
	`modul_id` text NOT NULL,
	`pesan` text NOT NULL,
	`rating_praktikum` real,
	`rating_asisten` real,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asisten_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `moduls` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`is_english` integer DEFAULT false,
	`is_unlocked` integer DEFAULT false NOT NULL,
	`unlock_config` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nilai_complaints` (
	`id` text PRIMARY KEY NOT NULL,
	`nilai_id` text NOT NULL,
	`praktikan_id` text NOT NULL,
	`message` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`nilai_id`) REFERENCES `nilais`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `nilais` (
	`id` text PRIMARY KEY NOT NULL,
	`tp` real NOT NULL,
	`ta` real NOT NULL,
	`d1` real NOT NULL,
	`d2` real NOT NULL,
	`d3` real NOT NULL,
	`d4` real NOT NULL,
	`l1` real NOT NULL,
	`l2` real NOT NULL,
	`avg` real NOT NULL,
	`rating` real,
	`modul_id` text NOT NULL,
	`asisten_id` text,
	`kelas_id` text NOT NULL,
	`praktikan_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asisten_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pollings` (
	`id` text PRIMARY KEY NOT NULL,
	`polling_id` text NOT NULL,
	`asisten_id` text,
	`praktikan_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`polling_id`) REFERENCES `jenis_pollings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asisten_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `praktikums` (
	`id` text PRIMARY KEY NOT NULL,
	`modul_id` text NOT NULL,
	`kelas_id` text NOT NULL,
	`pj_id` text,
	`dk` text(10) DEFAULT 'DK1' NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'idle' NOT NULL,
	`current_phase` text,
	`phase_started_at` integer,
	`phase_elapsed_seconds` integer DEFAULT 0,
	`started_at` integer,
	`ended_at` integer,
	`report_notes` text,
	`report_submitted_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pj_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`modul_id` text NOT NULL,
	`modul_link` text NOT NULL,
	`ppt_link` text NOT NULL,
	`video_link` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `soal_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`soal_type` text(10) NOT NULL,
	`soal_id` text NOT NULL,
	`asisten_id` text,
	`comment` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`asisten_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `soal_fitbs` (
	`id` text PRIMARY KEY NOT NULL,
	`modul_id` text NOT NULL,
	`soal` text NOT NULL,
	`enable_file_upload` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `soal_jurnals` (
	`id` text PRIMARY KEY NOT NULL,
	`modul_id` text NOT NULL,
	`soal` text NOT NULL,
	`enable_file_upload` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `soal_mandiris` (
	`id` text PRIMARY KEY NOT NULL,
	`modul_id` text NOT NULL,
	`soal` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `soal_opsis` (
	`id` text PRIMARY KEY NOT NULL,
	`soal_type` text(5) NOT NULL,
	`soal_id` text NOT NULL,
	`text` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `soal_tas` (
	`id` text PRIMARY KEY NOT NULL,
	`modul_id` text NOT NULL,
	`soal` text NOT NULL,
	`opsi1_id` text,
	`opsi2_id` text,
	`opsi3_id` text,
	`opsi_benar_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`opsi1_id`) REFERENCES `soal_opsis`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`opsi2_id`) REFERENCES `soal_opsis`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`opsi3_id`) REFERENCES `soal_opsis`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`opsi_benar_id`) REFERENCES `soal_opsis`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `soal_tks` (
	`id` text PRIMARY KEY NOT NULL,
	`modul_id` text NOT NULL,
	`soal` text NOT NULL,
	`opsi_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`opsi_id`) REFERENCES `soal_opsis`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `soal_tps` (
	`id` text PRIMARY KEY NOT NULL,
	`modul_id` text NOT NULL,
	`soal` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `temp_jawabantps` (
	`id` text PRIMARY KEY NOT NULL,
	`praktikan_id` text NOT NULL,
	`soal_id` text NOT NULL,
	`modul_id` text NOT NULL,
	`jawaban` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`soal_id`) REFERENCES `soal_tps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `temp_soaljurnals` (
	`id` text PRIMARY KEY NOT NULL,
	`praktikan_id` text NOT NULL,
	`soal_id` text NOT NULL,
	`modul_id` text NOT NULL,
	`jawaban` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`praktikan_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`soal_id`) REFERENCES `soal_jurnals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tugas_pendahuluan_kelas` (
	`id` text PRIMARY KEY NOT NULL,
	`tugas_pendahuluan_id` text NOT NULL,
	`kelas_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`tugas_pendahuluan_id`) REFERENCES `tugas_pendahuluans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tugas_pendahuluans` (
	`id` text PRIMARY KEY NOT NULL,
	`modul_id` text NOT NULL,
	`soal` text NOT NULL,
	`jawaban_benar` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`modul_id`) REFERENCES `moduls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`password_hash` text NOT NULL,
	`user_type` text NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`name` text NOT NULL,
	`nim` text,
	`alamat` text,
	`nomor_telepon` text,
	`email` text,
	`profile_picture` text,
	`kelas_id` text,
	`dk` text,
	`kode` text,
	`asisten_role` text,
	`deskripsi` text,
	`id_line` text,
	`instagram` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_identifier_unique` ON `users` (`identifier`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_nim_unique` ON `users` (`nim`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_kode_unique` ON `users` (`kode`);