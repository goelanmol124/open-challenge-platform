CREATE TABLE `challenges` (
	`id` varchar(36) NOT NULL,
	`owner_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`description` text NOT NULL,
	`category` varchar(128),
	`stage` varchar(64) NOT NULL,
	`deadline` datetime,
	`reward` varchar(255),
	`fields` json,
	`featured` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `endorsements` (
	`id` varchar(36) NOT NULL,
	`submission_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`note` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `endorsements_id` PRIMARY KEY(`id`),
	CONSTRAINT `endorsements_unique` UNIQUE(`submission_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`link` varchar(512),
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` varchar(36) NOT NULL,
	`challenge_id` varchar(36) NOT NULL,
	`author_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`fields` json,
	`status` varchar(64) NOT NULL,
	`upvote_count` int NOT NULL DEFAULT 0,
	`endorsement_count` int NOT NULL DEFAULT 0,
	`ai_status` varchar(16) NOT NULL DEFAULT 'pending',
	`ai_overall` int,
	`ai_scores` json,
	`ai_gate_passed` boolean,
	`ai_gate_reason` text,
	`ai_summary` text,
	`ai_flags` json,
	`ai_provider` varchar(64),
	`ai_model` varchar(128),
	`ai_attempts` int NOT NULL DEFAULT 0,
	`ai_error` text,
	`evaluated_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upvotes` (
	`id` varchar(36) NOT NULL,
	`submission_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `upvotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `upvotes_unique` UNIQUE(`submission_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`password_hash` varchar(255),
	`role` varchar(32) NOT NULL DEFAULT 'solver',
	`approved` boolean NOT NULL DEFAULT true,
	`organization` varchar(255),
	`bio` text,
	`profile` json,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `challenges` ADD CONSTRAINT `challenges_owner_id_users_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `endorsements` ADD CONSTRAINT `endorsements_submission_id_submissions_id_fk` FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `endorsements` ADD CONSTRAINT `endorsements_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_challenge_id_challenges_id_fk` FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `upvotes` ADD CONSTRAINT `upvotes_submission_id_submissions_id_fk` FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `upvotes` ADD CONSTRAINT `upvotes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `challenges_stage_idx` ON `challenges` (`stage`);--> statement-breakpoint
CREATE INDEX `challenges_owner_idx` ON `challenges` (`owner_id`);--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`,`is_read`);--> statement-breakpoint
CREATE INDEX `submissions_challenge_idx` ON `submissions` (`challenge_id`);--> statement-breakpoint
CREATE INDEX `submissions_author_idx` ON `submissions` (`author_id`);--> statement-breakpoint
CREATE INDEX `submissions_ai_status_idx` ON `submissions` (`ai_status`);