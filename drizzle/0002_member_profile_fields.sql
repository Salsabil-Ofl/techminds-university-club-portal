ALTER TABLE `members`
  ADD COLUMN `studentId` varchar(20) NULL,
  ADD COLUMN `linkedinUrl` varchar(512) NULL,
  ADD COLUMN `githubUrl` varchar(512) NULL;

--> statement-breakpoint

ALTER TABLE `members`
  MODIFY COLUMN `group` enum('Board','Technical','Media','Events','Members') NOT NULL;
