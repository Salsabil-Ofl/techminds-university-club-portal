CREATE TABLE `app_settings` (
	`key` varchar(64) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(160) NOT NULL,
	`category` enum('Workshop','Competition','Seminar','Networking') NOT NULL,
	`date` varchar(10) NOT NULL,
	`time` varchar(60) NOT NULL,
	`location` varchar(160) NOT NULL,
	`speaker` varchar(160) NOT NULL DEFAULT '',
	`icon` varchar(40) NOT NULL DEFAULT 'fa-calendar',
	`cover` varchar(20) NOT NULL DEFAULT 'cover-1',
	`seats` int NOT NULL DEFAULT 50,
	`short` varchar(300) NOT NULL,
	`description` text NOT NULL,
	`agenda` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`role` varchar(120) NOT NULL,
	`group` enum('Board','Technical','Media','Events') NOT NULL,
	`dept` varchar(120) NOT NULL,
	`year` varchar(40) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(320) NOT NULL,
	`subject` varchar(120) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`category` enum('Achievements','Announcements','Events','Partnerships') NOT NULL,
	`date` varchar(10) NOT NULL,
	`icon` varchar(40) NOT NULL DEFAULT 'fa-newspaper',
	`cover` varchar(20) NOT NULL DEFAULT 'cover-1',
	`excerpt` varchar(300) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `news_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket` varchar(20) NOT NULL,
	`eventId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`studentId` varchar(20) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`department` varchar(120) NOT NULL,
	`level` varchar(40) NOT NULL,
	`notes` text,
	`status` enum('confirmed','attended','cancelled') NOT NULL DEFAULT 'confirmed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `registrations_ticket_idx` UNIQUE(`ticket`)
);
--> statement-breakpoint
CREATE INDEX `registrations_event_idx` ON `registrations` (`eventId`);--> statement-breakpoint
CREATE INDEX `registrations_email_idx` ON `registrations` (`email`);